import type { Order } from "./types";

/** What the public tracking page may see: no name, phone or courier notes. */
export type PublicOrder = Omit<Order, "customer" | "paypalOrderId" | "paypalCaptureId" | "refund"> & {
  deliveryArea: string;
  refund?: { amount: number; reason: string; at: string };
};

/** Short, human-friendly order number shown in the UI and to the kitchen. */
export const orderCode = (id: string) =>
  id.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase();
