import { connection } from "next/server";
import { z } from "zod";
import { createOrder, getMenu, listOrders, updateOrder } from "@/lib/store";
import { createPayPalOrder } from "@/lib/paypal";
import { computeTotals } from "@/lib/pricing";
import { handleError, jsonError, readJson, requireAdmin } from "@/lib/api-utils";
import { isSameOrigin, rateLimit } from "@/lib/security";
import type { OrderLine } from "@/lib/types";

/** Kitchen only: all orders, including customer contact details. */
export async function GET(request: Request) {
  await connection();
  const denied = requireAdmin(request);
  if (denied) return denied;
  return Response.json({ orders: await listOrders() }, { headers: { "Cache-Control": "no-store" } });
}

// Strip control characters; React escapes output, this just keeps stored data clean.
const clean = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u001f\u007f]/g, " ").trim())
    .pipe(z.string().max(max));

const CreateOrderSchema = z.object({
  lines: z
    .array(
      z.object({
        itemId: z.string().max(64),
        quantity: z
          .number()
          .int()
          .min(1, "Quantity must be at least 1")
          .max(20, "You can order up to 20 of each item"),
      }),
    )
    .min(1, "Cart is empty")
    .max(30),
  customer: z.object({
    name: clean(80).pipe(z.string().min(2, "Please enter your name")),
    phone: clean(30).pipe(
      z.string().regex(/^[+()\d\s.-]{6,30}$/, "Please enter a valid phone number"),
    ),
    address: clean(200).pipe(z.string().min(6, "Please enter your delivery address")),
    notes: clean(300).optional(),
  }),
});

/**
 * Creates a local order (prices are always recomputed server-side from the menu)
 * and the matching PayPal order. Returns the PayPal order id for the JS SDK buttons.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Cross-site request blocked", 403);
  const limited = rateLimit(request, "create-order", { limit: 10, windowMs: 10 * 60_000 });
  if (limited) return limited;

  try {
    const body = await readJson(request, 16_000);
    if (body instanceof Response) return body;
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid order");
    }
    const { lines, customer } = parsed.data;

    const menu = await getMenu();
    const merged = new Map<string, number>();
    for (const l of lines) merged.set(l.itemId, (merged.get(l.itemId) ?? 0) + l.quantity);

    const orderLines: OrderLine[] = [];
    for (const [itemId, quantity] of merged) {
      const item = menu.find((m) => m.id === itemId);
      if (!item || !item.available) return jsonError("One of the items is no longer available");
      if (quantity > 20) return jsonError(`Too many ${item.name} in one order`);
      orderLines.push({ itemId: item.id, name: item.name, unitPrice: item.price, quantity });
    }

    const totals = computeTotals(orderLines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));

    const order = await createOrder({
      lines: orderLines,
      ...totals,
      currency: "EUR",
      customer: { ...customer, notes: customer.notes || undefined },
      status: "pending_payment",
    });

    const paypalOrder = await createPayPalOrder(order);
    await updateOrder(order.id, { paypalOrderId: paypalOrder.id });

    return Response.json({ orderId: order.id, paypalOrderId: paypalOrder.id });
  } catch (err) {
    return handleError(err);
  }
}
