import "server-only";
import type { Order } from "./types";

/**
 * Minimal PayPal Orders v2 client (sandbox by default).
 * Docs: https://developer.paypal.com/docs/api/orders/v2/
 */
const BASE_URL =
  process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";

export class PayPalError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new PayPalError(
      "PayPal is not configured: set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local",
      500,
    );
  }
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new PayPalError("Failed to get PayPal access token", res.status, json);
  }
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.value;
}

async function paypalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new PayPalError(`PayPal request failed: ${path}`, res.status, json);
  }
  return json as T;
}

const money = (value: number) => ({
  currency_code: "EUR",
  value: value.toFixed(2),
});

export async function createPayPalOrder(order: Order) {
  return paypalFetch<{ id: string; status: string }>("/v2/checkout/orders", {
    method: "POST",
    headers: { "PayPal-Request-Id": `create-${order.id}` },
    body: JSON.stringify({
      intent: "CAPTURE",
      // Applies to every funding source the buttons offer (PayPal balance, card, Pay Later).
      application_context: {
        brand_name: "Pizza di Napi",
        // We collect the delivery address ourselves, so PayPal shouldn't ask for one.
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
      purchase_units: [
        {
          reference_id: order.id,
          description: `Pizza di Napi order ${order.id}`,
          amount: {
            ...money(order.total),
            breakdown: {
              item_total: money(order.subtotal),
              shipping: money(order.deliveryFee),
            },
          },
          items: order.lines.map((l) => ({
            name: l.name,
            quantity: String(l.quantity),
            unit_amount: money(l.unitPrice),
            category: "PHYSICAL_GOODS",
          })),
        },
      ],
    }),
  });
}

interface CaptureResponse {
  id: string;
  status: string;
  purchase_units: {
    reference_id?: string;
    payments?: {
      captures?: {
        id: string;
        status: string;
        amount?: { currency_code: string; value: string };
      }[];
    };
  }[];
}

/**
 * Full refund of a captured payment (Payments v2).
 * Docs: https://developer.paypal.com/docs/api/payments/v2/#captures_refund
 */
export async function refundCapture(order: Order, reason: string) {
  if (!order.paypalCaptureId) throw new PayPalError("Order has no captured payment", 409);
  return paypalFetch<{ id: string; status: string }>(
    `/v2/payments/captures/${order.paypalCaptureId}/refund`,
    {
      method: "POST",
      headers: { "PayPal-Request-Id": `refund-${order.id}` },
      body: JSON.stringify({
        amount: money(order.total),
        invoice_id: order.id,
        note_to_payer: `Pizza di Napi refunded your order: ${reason}`.slice(0, 255),
      }),
    },
  );
}

export async function capturePayPalOrder(paypalOrderId: string) {
  const res = await paypalFetch<CaptureResponse>(
    `/v2/checkout/orders/${paypalOrderId}/capture`,
    { method: "POST", headers: { "PayPal-Request-Id": `capture-${paypalOrderId}` } },
  );
  const unit = res.purchase_units[0];
  const capture = unit?.payments?.captures?.[0];
  return {
    status: res.status,
    captureStatus: capture?.status,
    captureId: capture?.id,
    amount: capture?.amount,
    referenceId: unit?.reference_id,
  };
}
