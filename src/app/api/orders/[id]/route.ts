import { connection } from "next/server";
import { z } from "zod";
import { getOrder, setOrderStatus } from "@/lib/store";
import { jsonError, readJson, requireAdmin } from "@/lib/api-utils";
import { rateLimit } from "@/lib/security";
import { STATUS_FLOW } from "@/lib/types";
import type { PublicOrder } from "@/lib/types-public";

const ID = /^[A-Za-z0-9_-]{16,32}$/;

/**
 * Public order tracking. Anyone with the (unguessable) link sees the status and
 * items, but never the customer's name, phone, notes or payment ids.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  await connection();
  const limited = rateLimit(request, "track-order", { limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  const { id } = await ctx.params;
  if (!ID.test(id)) return jsonError("Order not found", 404);
  const order = await getOrder(id);
  if (!order) return jsonError("Order not found", 404);

  const { customer, paypalOrderId: _p, paypalCaptureId: _c, ...rest } = order;
  void _p;
  void _c;
  // Street only: enough for the customer to recognise it, nothing more.
  const deliveryArea = customer.address.split(",")[0].slice(0, 60);
  const publicOrder: PublicOrder = { ...rest, deliveryArea };
  return Response.json({ order: publicOrder }, { headers: { "Cache-Control": "no-store" } });
}

const PatchSchema = z.object({ status: z.enum([...STATUS_FLOW, "cancelled"]) });

/** Kitchen: move an order through received → preparing → out_for_delivery → delivered. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!ID.test(id)) return jsonError("Order not found", 404);
  const body = await readJson(request, 1_000);
  if (body instanceof Response) return body;
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid status");

  const existing = await getOrder(id);
  if (!existing) return jsonError("Order not found", 404);
  if (existing.status === "pending_payment") return jsonError("Order is not paid yet", 409);

  return Response.json({ order: await setOrderStatus(id, parsed.data.status) });
}
