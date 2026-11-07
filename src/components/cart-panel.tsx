"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./providers";
import { Stepper } from "./stepper";
import { computeTotals, formatEUR } from "@/lib/pricing";
import { FREE_DELIVERY_FROM } from "@/lib/menu-seed";

/** Desktop sidebar: the order builds up next to the menu. */
export function CartPanel() {
  const { lines, menu, setQty, subtotal } = useCart();
  const totals = computeTotals(subtotal);
  const toFree = FREE_DELIVERY_FROM - subtotal;

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="font-display text-2xl text-oven">Your order</h2>

      {lines.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Nothing here yet. Add something from the menu, or ask Slicey to put an order together for you.
        </p>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {lines.map((l) => {
              const item = menu.find((m) => m.id === l.itemId);
              if (!item) return null;
              return (
                <li key={l.itemId} className="flex items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-flour">
                    {item.image ? (
                      <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center">{item.emoji}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted tabular-nums">{formatEUR(item.price * l.quantity)}</p>
                  </div>
                  <Stepper value={l.quantity} onChange={(n) => setQty(l.itemId, n)} label={item.name} />
                </li>
              );
            })}
          </ul>

          <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatEUR(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="tabular-nums">
                {totals.deliveryFee === 0 ? "Free" : formatEUR(totals.deliveryFee)}
              </dd>
            </div>
            <div className="flex justify-between pt-1 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatEUR(totals.total)}</dd>
            </div>
          </dl>
          {toFree > 0 && (
            <p className="mt-2 text-xs text-muted">
              Add {formatEUR(toFree)} more for free delivery.
            </p>
          )}
          <Link
            href="/cart"
            className="mt-4 block rounded-lg bg-tomato py-3 text-center font-semibold text-white transition hover:brightness-110"
          >
            Go to checkout
          </Link>
        </>
      )}
    </div>
  );
}
