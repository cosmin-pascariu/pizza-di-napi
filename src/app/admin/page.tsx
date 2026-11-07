"use client";

import { useCallback, useEffect, useState } from "react";
import { formatEUR } from "@/lib/pricing";
import { KitchenAssistant } from "@/components/kitchen-assistant";
import { KitchenOrderCard } from "@/components/kitchen-order-card";
import { STATUS_FLOW, type Order, type OrderStatus } from "@/lib/types";

const COLUMNS: { status: OrderStatus; title: string }[] = [
  { status: "received", title: "New" },
  { status: "preparing", title: "In the oven" },
  { status: "out_for_delivery", title: "On the road" },
  { status: "delivered", title: "Delivered" },
];

/** Button label for moving an order to the given status. */
const NEXT_ACTION: Partial<Record<OrderStatus, string>> = {
  preparing: "Start baking",
  out_for_delivery: "Send out",
  delivered: "Mark delivered",
};

function nextStatus(s: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(s);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
}

type AuthState = "checking" | "signed-in" | "signed-out" | "locked";

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [auth, setAuth] = useState<AuthState>("checking");
  const [devOpen, setDevOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  // Computed on the client only, so prerendering stays deterministic.
  const [today, setToday] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setToday(new Date().toDateString()), []);

  const load = useCallback(async () => {
    const res = await fetch("/api/orders", { cache: "no-store" });
    if (res.status === 401) return setAuth("signed-out");
    if (res.status === 503) return setAuth("locked");
    if (!res.ok) return;
    setAuth("signed-in");
    setOrders((await res.json()).orders);
  }, []);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: { mode: string; signedIn: boolean }) => {
        setDevOpen(s.mode === "open-dev");
        if (s.mode === "locked") setAuth("locked");
        else if (s.signedIn) load();
        else setAuth("signed-out");
      })
      .catch(() => setAuth("signed-out"));
  }, [load]);

  useEffect(() => {
    if (auth !== "signed-in") return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [auth, load]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setPin("");
    if (res.ok) return load();
    const json = await res.json().catch(() => ({}));
    setLoginError(json.error ?? "Could not sign in");
  }

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setOrders(null);
    setAuth("signed-out");
  }

  async function advance(order: Order, status: OrderStatus) {
    setOrders((prev) => prev?.map((o) => (o.id === order.id ? { ...o, status } : o)) ?? null);
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (auth === "locked") {
    return (
      <div className="mx-auto mt-16 max-w-sm px-4 text-center">
        <h1 className="font-display text-3xl text-oven">Kitchen is locked</h1>
        <p className="mt-2 text-muted">
          Set the <code>ADMIN_PIN</code> environment variable on the server to enable the kitchen
          dashboard.
        </p>
      </div>
    );
  }

  if (auth === "signed-out") {
    return (
      <form onSubmit={signIn} className="mx-auto mt-16 max-w-xs space-y-3 px-4 text-center">
        <h1 className="font-display text-3xl text-oven">Kitchen sign-in</h1>
        <p className="text-sm text-muted">Enter the kitchen PIN to see and manage orders.</p>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          aria-label="Kitchen PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-center"
        />
        {loginError && <p className="text-sm text-tomato">{loginError}</p>}
        <button className="w-full rounded-lg bg-ink py-2.5 font-semibold text-page">Sign in</button>
      </form>
    );
  }

  const paid = orders?.filter((o) => o.status !== "pending_payment" && o.status !== "cancelled") ?? [];
  const cancelled = orders?.filter((o) => o.status === "cancelled") ?? [];
  const onRefunded = (updated: Order) =>
    setOrders((prev) => prev?.map((o) => (o.id === updated.id ? updated : o)) ?? null);
  const todays = paid.filter((o) => new Date(o.createdAt).toDateString() === today);
  const revenue = todays.reduce((s, o) => s + o.total, 0);

  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6 md:px-6">
      <div className="px-4 md:px-0">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-oven">Kitchen</h1>
          {!devOpen && auth === "signed-in" && (
            <button onClick={signOut} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-flour hover:text-ink">
              Sign out
            </button>
          )}
        </div>
        {devOpen && (
          <p className="mt-2 rounded-lg bg-tomato-soft px-3 py-2 text-sm text-tomato">
            Development mode: the kitchen is open because no <code>ADMIN_PIN</code> is set. In
            production it stays locked until you set one.
          </p>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="Orders today" value={String(todays.length)} />
          <Stat label="Revenue today" value={formatEUR(revenue)} />
          <Stat
            label="Active"
            value={String(paid.filter((o) => o.status !== "delivered").length)}
          />
        </div>
        <KitchenAssistant />
      </div>

      {orders === null ? (
        <p className="py-10 text-center text-muted">Loading…</p>
      ) : (
        <div className="mt-5 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {COLUMNS.map((col) => {
            const list = paid.filter((o) => o.status === col.status);
            return (
              <section key={col.status} className="w-[80vw] max-w-xs shrink-0 snap-start md:w-auto">
                <h2 className="mb-2 flex items-center justify-between text-sm font-medium text-muted">
                  {col.title}
                  <span className="rounded-full bg-card px-2 text-xs">{list.length}</span>
                </h2>
                <ul className="space-y-2">
                  {list.length === 0 && (
                    <li className="rounded-2xl border border-dashed border-line p-4 text-center text-xs text-muted">
                      Nothing here
                    </li>
                  )}
                  {list.map((o) => {
                    const next = nextStatus(o.status);
                    return (
                      <KitchenOrderCard
                        key={o.id}
                        order={o}
                        nextLabel={next ? NEXT_ACTION[next] : undefined}
                        onAdvance={next ? () => advance(o, next) : undefined}
                        onRefunded={onRefunded}
                      />
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {cancelled.length > 0 && (
        <section className="mt-6 px-4 md:px-0">
          <h2 className="mb-2 text-sm font-medium text-muted">
            Cancelled and refunded ({cancelled.length})
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            {cancelled.map((o) => (
              <KitchenOrderCard key={o.id} order={o} onRefunded={onRefunded} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-display text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
