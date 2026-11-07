import { getOrder, updateOrder } from "@/lib/store";
import { capturePayPalOrder } from "@/lib/paypal";
import { handleError, jsonError } from "@/lib/api-utils";
import { isSameOrigin, rateLimit } from "@/lib/security";

const ID = /^[A-Za-z0-9_-]{16,32}$/;

/**
 * Called after the buyer approves the payment in the PayPal popup.
 * The PayPal order id comes from our own database (never from the browser), and the
 * captured amount must match the order exactly before it is marked as paid.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/orders/[id]/capture">) {
  if (!isSameOrigin(request)) return jsonError("Cross-site request blocked", 403);
  const limited = rateLimit(request, "capture", { limit: 20, windowMs: 10 * 60_000 });
  if (limited) return limited;

  try {
    const { id } = await ctx.params;
    if (!ID.test(id)) return jsonError("Order not found", 404);
    const order = await getOrder(id);
    if (!order) return jsonError("Order not found", 404);
    if (order.status !== "pending_payment") return Response.json({ ok: true });
    if (!order.paypalOrderId) return jsonError("Order has no PayPal payment", 409);

    const result = await capturePayPalOrder(order.paypalOrderId);
    if (result.status !== "COMPLETED" || result.captureStatus !== "COMPLETED") {
      return jsonError("The payment was not completed. You have not been charged.", 402);
    }

    const paidOk =
      result.referenceId === order.id &&
      result.amount?.currency_code === order.currency &&
      result.amount?.value === order.total.toFixed(2);
    if (!paidOk) {
      console.error("[paypal] capture mismatch", { orderId: order.id, result });
      return jsonError("Payment amount did not match the order. Please contact us.", 409);
    }

    await updateOrder(id, { status: "received", paypalCaptureId: result.captureId });
    return Response.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
