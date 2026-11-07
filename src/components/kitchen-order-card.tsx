"use client";

import { useState } from "react";
import { formatEUR } from "@/lib/pricing";
import { orderCode } from "@/lib/types-public";
import type { Order } from "@/lib/types";

const REASONS = [
  "We ran out of an ingredient",
  "The kitchen is too busy right now",
  "Address is outside our delivery area",
  "Customer asked to cancel",
];

export function KitchenOrderCard({
  order,
  nextLabel,
  onAdvance,
  onRefunded,
}: {
  order: Order;
  nextLabel?: string;
  onAdvance?: () => void;
  onRefunded: (order: Order) => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canRefund = order.status !== "delivered" && order.status !== "cancelled";

  async function refund() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok) return setError(json.error ?? "Refund failed");
      setCancelling(false);
      onRefunded(json.order);
    } catch {
      setError("Network error, please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl border border-line bg-card p-3 text-sm">
      <div className="flex justify-between">
        <span className="font-semibold">#{orderCode(order.id)}</span>
        <span className="text-muted">
          {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <ul className="mt-1.5 text-muted">
        {order.lines.map((l) => (
          <li key={l.itemId}>
            {l.quantity}× {l.name}
          </li>
        ))}
      </ul>
      <p className="mt-1.5 truncate text-xs text-muted">
        {order.customer.name}, {order.customer.address}
      </p>
      {order.customer.notes && (
        <p className="mt-1 rounded bg-flour px-2 py-1 text-xs">“{order.customer.notes}”</p>
      )}

      {order.refund ? (
        <p className="mt-2 rounded-lg bg-tomato-soft px-2 py-1.5 text-xs text-tomato">
          Refunded {formatEUR(order.refund.amount)} via PayPal: {order.refund.reason}
        </p>
      ) : cancelling ? (
        <div className="mt-2 space-y-2 rounded-lg border border-line p-2">
          <label className="block text-xs font-semibold" htmlFor={`reason-${order.id}`}>
            Why are you cancelling?
          </label>
          <select
            id={`reason-${order.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border border-line bg-page px-2 py-1.5 text-xs"
          >
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <p className="text-xs text-muted">
            The customer gets {formatEUR(order.total)} back on PayPal and sees the reason on their
            tracking page.
          </p>
          {error && <p className="text-xs text-tomato">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={refund}
              disabled={busy}
              className="flex-1 rounded-md bg-tomato px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Refunding…" : `Refund ${formatEUR(order.total)}`}
            </button>
            <button
              onClick={() => setCancelling(false)}
              disabled={busy}
              className="rounded-md px-2 py-1.5 text-xs text-muted hover:bg-flour"
            >
              Keep order
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-medium">{formatEUR(order.total)}</span>
          <div className="flex items-center gap-1">
            {canRefund && (
              <button
                onClick={() => setCancelling(true)}
                className="rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-tomato-soft hover:text-tomato"
              >
                Cancel
              </button>
            )}
            {nextLabel && onAdvance && (
              <button
                onClick={onAdvance}
                className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white active:scale-95"
              >
                {nextLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
