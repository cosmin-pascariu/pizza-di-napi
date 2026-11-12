import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";
import { getMenu } from "@/lib/store";
import { cartTools, type AssistantMessage } from "@/lib/ai/cart-tools";
import { aiProviderOptions, chatModel, isAiConfigured, MAX_OUTPUT_TOKENS } from "@/lib/ai/model";
import { jsonError, readJson } from "@/lib/api-utils";
import { isSameOrigin, rateLimit } from "@/lib/security";
import { z } from "zod";
import { DELIVERY_FEE, FREE_DELIVERY_FROM, PIZZA_FLOUR } from "@/lib/menu-seed";
import type { CartLine, MenuItem } from "@/lib/types";

export const maxDuration = 30;

const MAX_HISTORY = 20;

function buildInstructions(menu: MenuItem[], cart: CartLine[]) {
  const menuText = menu
    .map(
      (m) =>
        `- id: ${m.id} | ${m.name} | €${m.price.toFixed(2)} | ${m.category} | ${m.description}` +
        (m.tags.length ? ` | tags: ${m.tags.join(", ")}` : "") +
        (m.kcal ? ` | ~${m.kcal} kcal${m.portion ? ` per ${m.portion}` : ""}` : "") +
        (m.flour ? ` | flour: ${m.flour}` : "") +
        (m.allergens ? ` | allergens: ${m.allergens.join(", ") || "none"}` : ""),
    )
    .join("\n");

  const cartText = cart.length
    ? cart
        .map((l) => {
          const item = menu.find((m) => m.id === l.itemId);
          return `- ${l.quantity}× ${item?.name ?? l.itemId} (id: ${l.itemId})`;
        })
        .join("\n")
    : "(empty)";

  return `You are Slicey, the friendly ordering assistant of Pizza di Napi, a Neapolitan wood-fired pizzeria.
Your job: help the customer build the right order quickly, then send them to checkout (they pay with PayPal).

Rules:
- Only recommend items from the MENU below. Never invent items or prices.
- When the customer wants something, call add_to_cart / set_quantity right away instead of asking for permission. Use exact ids.
- Make all the tool calls for a request together, in one step, and write no text between them. Reply once, after the cart is updated.
- For groups, plan roughly 1 pizza per adult (0.5 for kids) unless told otherwise, respect dietary needs (vegetarian/vegan/spicy) and stay within any budget, counting delivery.
- Delivery costs €${DELIVERY_FEE.toFixed(2)} and is free from €${FREE_DELIVERY_FROM.toFixed(2)}. Mention it when it helps the customer save.
- After changing the cart, reply with a short summary (max 4 lines) of what you added and the new total, and ask if they are ready to pay.
- When the customer says they are done or ready to pay, call go_to_checkout. Payment always happens on the checkout page with PayPal; never ask for card or payment details in the chat.
- You can answer questions about ingredients, calories and allergens using only the MENU data. Calories are approximate. All doughs use ${PIZZA_FLOUR} flour (wheat, contains gluten); there is no gluten-free dough. The kitchen also handles nuts and sesame, so traces are possible: for serious allergies, tell the customer to mention it in the courier notes at checkout.
- Reply in the same language as the customer's last message (English by default). Italian dish names don't mean the customer writes Italian. Plain text only, no markdown, no tables.
- If asked about anything unrelated to ordering food here, politely steer back.

MENU (only these items are available today):
${menuText}

CURRENT CART:
${cartText}`;
}

const ChatSchema = z.object({
  messages: z
    .array(
      z
        .object({
          id: z.string().max(100),
          role: z.enum(["user", "assistant"]),
          parts: z.array(z.looseObject({ type: z.string().max(60) })).max(30),
        })
        .loose(),
    )
    .min(1)
    .max(60),
  cart: z
    .array(z.object({ itemId: z.string().max(64), quantity: z.number().int().min(0).max(20) }))
    .max(30)
    .optional(),
});

/** Longest text the customer can send in one message. */
const MAX_USER_TEXT = 600;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Cross-site request blocked", 403);
  // Protects the (free-tier) AI quota from abuse.
  const limited =
    rateLimit(request, "chat-minute", { limit: 12, windowMs: 60_000 }) ??
    rateLimit(request, "chat-day", { limit: 150, windowMs: 24 * 60 * 60_000 });
  if (limited) return limited;

  if (!isAiConfigured()) {
    return jsonError(
      "The AI assistant is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY in .env.local.",
      503,
    );
  }

  const body = await readJson(request, 64_000);
  if (body instanceof Response) return body;
  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request");
  const messages = parsed.data.messages as unknown as AssistantMessage[];
  const cart: CartLine[] = parsed.data.cart ?? [];

  const tooLong = messages.some(
    (m) =>
      m.role === "user" &&
      m.parts.some((p) => p.type === "text" && p.text.length > MAX_USER_TEXT),
  );
  if (tooLong) return jsonError(`Messages are limited to ${MAX_USER_TEXT} characters`);

  // Keep the prompt small (free-tier friendly): last N messages, starting at a user turn.
  let recent = messages.slice(-MAX_HISTORY);
  const firstUser = recent.findIndex((m) => m.role === "user");
  recent = firstUser > 0 ? recent.slice(firstUser) : recent;

  const menu = (await getMenu()).filter((m) => m.available);

  const result = streamText({
    model: chatModel(),
    instructions: buildInstructions(menu, cart),
    messages: await convertToModelMessages(recent),
    tools: cartTools,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    providerOptions: aiProviderOptions,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
