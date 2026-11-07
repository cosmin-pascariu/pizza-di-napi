import { DELIVERY_FEE, FREE_DELIVERY_FROM } from "./menu-seed";

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeTotals(subtotal: number) {
  const deliveryFee = subtotal >= FREE_DELIVERY_FROM || subtotal === 0 ? 0 : DELIVERY_FEE;
  return {
    subtotal: round2(subtotal),
    deliveryFee,
    total: round2(subtotal + deliveryFee),
  };
}

export const formatEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);
