import { generateText, isStepCount, tool } from "ai";
import { z } from "zod";
import { addMenuItem, getMenu, listOrders, updateMenuItem } from "@/lib/store";
import { chatModel, isAiConfigured } from "@/lib/ai/model";
import { handleError, jsonError, readJson, requireAdmin } from "@/lib/api-utils";
import { rateLimit } from "@/lib/security";

export const maxDuration = 30;

const TAGS = ["vegetarian", "vegan", "spicy", "bestseller"] as const;

/**
 * Kitchen assistant: the owner manages the menu in natural language
 * ("Diavola is €11 from today, we're out of tiramisu") and asks about today's sales.
 */
export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const limited = rateLimit(request, "kitchen-ai", { limit: 20, windowMs: 60_000 });
  if (limited) return limited;
  if (!isAiConfigured()) {
    return jsonError("The AI assistant is not configured (GOOGLE_GENERATIVE_AI_API_KEY).", 503);
  }

  try {
    const body = await readJson<{ instruction?: unknown }>(request, 4_000);
    if (body instanceof Response) return body;
    const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";
    if (!instruction) return jsonError("Instruction is required");

    const changes: string[] = [];
    const menu = await getMenu();
    const today = new Date().toDateString();
    const paidToday = (await listOrders()).filter(
      (o) =>
        !["pending_payment", "cancelled"].includes(o.status) &&
        new Date(o.createdAt).toDateString() === today,
    );
    const sold = new Map<string, number>();
    for (const o of paidToday) for (const l of o.lines) sold.set(l.name, (sold.get(l.name) ?? 0) + l.quantity);

    const result = await generateText({
      model: chatModel(),
      maxOutputTokens: 600,
      stopWhen: isStepCount(6),
      instructions: `You are the back-office assistant of the Pizza di Napi pizzeria. You help the owner manage the menu and understand today's sales.
Use the tools to apply menu changes. Prices are in EUR. "Out of stock" / "remove for today" means available=false, not deleting.
After acting, answer in 1-3 short plain-text sentences listing what changed. Reply in the owner's language. If the request is ambiguous, ask a short clarifying question instead of guessing.

MENU:
${menu.map((m) => `- id: ${m.id} | ${m.name} | €${m.price.toFixed(2)} | ${m.category} | available: ${m.available} | tags: ${m.tags.join(", ") || "-"}`).join("\n")}

TODAY: ${paidToday.length} paid orders, revenue €${paidToday.reduce((s, o) => s + o.total, 0).toFixed(2)}.
Items sold today: ${[...sold].map(([n, q]) => `${q}× ${n}`).join(", ") || "none yet"}.`,
      prompt: instruction.slice(0, 1000),
      tools: {
        update_menu_item: tool({
          description: "Update an existing menu item (price, availability, name, description or tags).",
          inputSchema: z.object({
            itemId: z.string(),
            price: z.number().positive().max(200).optional(),
            available: z.boolean().optional(),
            name: z.string().min(2).max(60).optional(),
            description: z.string().max(200).optional(),
            tags: z.array(z.enum(TAGS)).optional(),
          }),
          execute: async ({ itemId, ...patch }) => {
            const item = await updateMenuItem(itemId, patch);
            if (!item) return { ok: false, message: `No item with id ${itemId}` };
            const msg = `Updated ${item.name}: ${Object.entries(patch)
              .map(([k, v]) => `${k} → ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(", ")}`;
            changes.push(msg);
            return { ok: true, message: msg };
          },
        }),
        add_menu_item: tool({
          description: "Add a new item to the menu.",
          inputSchema: z.object({
            id: z.string().regex(/^[a-z0-9-]+$/).describe("kebab-case id, e.g. 'pizza-tonno'"),
            name: z.string().min(2).max(60),
            description: z.string().max(200),
            price: z.number().positive().max(200),
            category: z.enum(["pizza", "sides", "drinks", "desserts"]),
            emoji: z.string().max(4).describe("One food emoji"),
            tags: z.array(z.enum(TAGS)),
          }),
          execute: async (item) => {
            const res = await addMenuItem({ ...item, available: true });
            if ("error" in res) return { ok: false, message: res.error };
            changes.push(`Added ${res.name} (€${res.price.toFixed(2)})`);
            return { ok: true, message: `Added ${res.name}` };
          },
        }),
      },
    });

    return Response.json({ reply: result.text, changes });
  } catch (err) {
    return handleError(err);
  }
}
