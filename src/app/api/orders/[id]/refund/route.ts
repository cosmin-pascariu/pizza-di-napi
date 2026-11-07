import { z } from "zod";
import { getOrder, updateOrder } from "@/lib/store";
import { refundCapture } from "@/lib/paypal";
import { handleError, jsonError, readJson, requireAdmin } from "@/lib/api-utils";
import { rateLimit } from "@/lib/security";

const ID = /^[A-Za-z0-9_-]{16,32}$/;

const RefundSchema = z.object({
  reason: z
    .string()
    .transform((s) => s.replace(/[\u0000-\u001f\u007f]/g, " ").trim())
    .pipe(z.string().min(3, "Please give a short reason").max(140)),
});

/**
 * Kitchen: cancel a paid order and refund the customer in full through PayPal.
 * Only orders that are paid and not yet delivered can be refunded, and only once.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/orders/[id]/refund">) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const limited = rateLimit(request, "refund", { limit: 20, windowMs: 10 * 60_000 });
  if (limited) return limited;

  try {
    const { id } = await ctx.params;
    if (!ID.test(id)) return jsonError("Order not found", 404);
    const body = await readJson(request, 2_000);
    if (body instanceof Response) return body;
    const parsed = RefundSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid reason");

    const order = await getOrder(id);
    if (!order) return jsonError("Order not found", 404);
    if (order.refund) return Response.json({ order });
    if (order.status === "pending_payment" || !order.paypalCaptureId) {
      return jsonError("This order was never paid, so there is nothing to refund.", 409);
    }
    if (order.status === "delivered") {
      return jsonError("Delivered orders can't be refunded from the kitchen board.", 409);
    }

    const refund = await refundCapture(order, parsed.data.reason);
    if (refund.status !== "COMPLETED" && refund.status !== "PENDING") {
      return jsonError(`PayPal did not accept the refund (${refund.status}).`, 502);
    }

    const updated = await updateOrder(id, {
      status: "cancelled",
      refund: {
        paypalRefundId: refund.id,
        status: refund.status,
        amount: order.total,
        reason: parsed.data.reason,
        at: new Date().toISOString(),
      },
    });
    return Response.json({ order: updated });
  } catch (err) {
    return handleError(err);
  }
}
