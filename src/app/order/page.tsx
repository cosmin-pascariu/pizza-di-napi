"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { formatEUR } from "@/lib/pricing";
import { STATUS_FLOW, STATUS_LABEL } from "@/lib/types";
import { orderCode, type PublicOrder } from "@/lib/types-public";

export default function OrderPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-muted">Loading…</p>}>
      <OrderTracker />
    </Suspense>
  );
}

const STEP_ICON = ["🧾", "🔥", "🛵", "🏠"];

function OrderTracker() {
  const id = useSearchParams().get("id");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    const load = async () => {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!alive) return;
      if (res.status === 404) return setNotFound(true);
      if (res.ok) setOrder((await res.json()).order);
    };
    load();
    const t = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id]);

  if (!id || notFound) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Order not found</h1>
        <Link href="/" className="mt-4 inline-block text-tomato underline">
          Back to menu
        </Link>
      </div>
    );
  }
  if (!order) return <p className="py-20 text-center text-muted">Loading…</p>;

  const current = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-8">
      <div
        className={`rounded-2xl px-5 py-6 text-white ${
          order.status === "cancelled" ? "bg-[#8f2a1a]" : "bg-[#1f4d35]"
        }`}
      >
        <p className="text-sm opacity-80">Order #{orderCode(order.id)}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          {order.status === "cancelled" ? "Order cancelled" : STATUS_LABEL[order.status]}
        </h1>
        <p className="mt-1 text-sm opacity-90">
          {order.status === "cancelled" && order.refund
            ? `${formatEUR(order.refund.amount)} has been refunded to your PayPal account.`
            : order.status === "delivered"
              ? "Enjoy your meal! 🍕"
              : `Paid with PayPal: ${formatEUR(order.total)}`}
        </p>
      </div>

      {order.refund && (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4 text-sm">
          <p className="font-semibold">Why was it cancelled?</p>
          <p className="mt-1 text-muted">{order.refund.reason}.</p>
          <p className="mt-2 text-muted">
            The refund is processed by PayPal and usually shows up in your account within minutes.
            We&apos;re sorry, and we hope to bake for you again soon.
          </p>
        </div>
      )}

      {order.status !== "cancelled" && (
        <ol className="mt-5 space-y-3">
          {STATUS_FLOW.map((s, i) => {
            const done = i <= current;
            return (
              <li
                key={s}
                className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                  done ? "border-basil bg-basil-soft" : "border-line bg-card opacity-60"
                } ${i === current ? "ring-2 ring-basil" : ""}`}
              >
                <span className="text-2xl">{STEP_ICON[i]}</span>
                <span className="font-medium">{STATUS_LABEL[s]}</span>
                {i === current && order.status !== "delivered" && (
                  <span className="ml-auto h-2 w-2 animate-ping rounded-full bg-basil" />
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-5 rounded-2xl border border-line bg-card p-4 text-sm">
        <ul className="space-y-1">
          {order.lines.map((l) => (
            <li key={l.itemId} className="flex justify-between">
              <span>
                {l.quantity}× {l.name}
              </span>
              <span className="tabular-nums">{formatEUR(l.unitPrice * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold">
          <span>Total</span>
          <span>{formatEUR(order.total)}</span>
        </div>
        <p className="mt-3 text-muted">Delivering to {order.deliveryArea}</p>
      </div>

      <p className="mt-4 text-center text-xs text-muted">This page updates automatically.</p>
    </div>
  );
}
