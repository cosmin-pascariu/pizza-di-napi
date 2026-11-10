"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useCart } from "@/components/providers";
import { Stepper } from "@/components/stepper";
import { computeTotals, formatEUR } from "@/lib/pricing";
import { FREE_DELIVERY_FROM } from "@/lib/menu-seed";
import type { Customer } from "@/lib/types";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

export default function CartPage() {
  const router = useRouter();
  const { lines, menu, menuLoaded, setQty, subtotal, clear } = useCart();
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orderIdRef = useRef<string | null>(null);
  // PayPal buttons keep the callbacks from their first render, so read fresh values via refs.
  const checkoutRef = useRef({ lines, customer });
  useEffect(() => {
    checkoutRef.current = { lines, customer };
  }, [lines, customer]);

  const totals = computeTotals(subtotal);
  const isValid = isCustomerValid(customer);

  if (menuLoaded && lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-5xl">🍕</p>
        <h1 className="mt-4 font-display text-4xl text-oven">Your cart is empty</h1>
        <p className="mt-2 text-muted">Pick something from the menu, or let Slicey suggest an order.</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-tomato px-5 py-3 font-semibold text-white">
          See the menu
        </Link>
      </div>
    );
  }

  const field = (key: keyof Customer, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const invalid = touched && key !== "notes" && customer[key]!.trim().length < 2;
    return (
      <label className="block">
        <span className="mb-1 block text-sm text-muted">{label}</span>
        <input
          {...props}
          value={customer[key] ?? ""}
          onChange={(e) => setCustomer((c) => ({ ...c, [key]: e.target.value }))}
          className={`w-full rounded-xl border bg-card px-3 py-2.5 outline-none focus:border-ink ${
            invalid ? "border-tomato" : "border-line"
          }`}
        />
      </label>
    );
  };

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-8 px-4 pb-16 pt-8 sm:px-6 md:grid-cols-[minmax(0,1fr)_340px]">
      <section>
        <h1 className="mb-4 font-display text-4xl text-oven">Your order</h1>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
          {lines.map((l) => {
            const item = menu.find((m) => m.id === l.itemId);
            if (!item) return null;
            return (
              <li key={l.itemId} className="flex items-center gap-3 p-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-flour">
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-2xl">{item.emoji}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium leading-snug">{item.name}</p>
                  <p className="text-sm text-muted tabular-nums">
                    <span className="sm:hidden">{formatEUR(item.price * l.quantity)}</span>
                    <span className="hidden sm:inline">{formatEUR(item.price)}</span>
                  </p>
                </div>
                <Stepper value={l.quantity} onChange={(n) => setQty(l.itemId, n)} label={item.name} />
                <span className="hidden w-16 text-right font-medium tabular-nums sm:block">
                  {formatEUR(item.price * l.quantity)}
                </span>
              </li>
            );
          })}
        </ul>

        <h2 className="mb-3 mt-8 font-display text-2xl text-oven">Delivery details</h2>
        <div className="grid gap-3">
          {field("name", "Name", { autoComplete: "name" })}
          {field("phone", "Phone", { autoComplete: "tel", inputMode: "tel" })}
          {field("address", "Address", { autoComplete: "street-address" })}
          {field("notes", "Notes for the courier (optional)")}
        </div>
      </section>

      <aside className="md:sticky md:top-20 md:self-start">
        <div className="rounded-2xl border border-line bg-card p-5">
          <dl className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatEUR(totals.subtotal)} />
            <Row
              label="Delivery"
              value={totals.deliveryFee === 0 ? "Free" : formatEUR(totals.deliveryFee)}
            />
            {totals.deliveryFee > 0 && (
              <p className="text-xs text-muted">
                Free delivery from {formatEUR(FREE_DELIVERY_FROM)}
              </p>
            )}
            <div className="border-t border-line pt-2">
              <Row label="Total" value={formatEUR(totals.total)} strong />
            </div>
          </dl>

          <div className="mt-4">
            {error && (
              <p className="mb-3 rounded-lg bg-tomato-soft px-3 py-2 text-sm text-tomato">{error}</p>
            )}
            {!isValid && touched && (
              <p className="mb-3 text-sm text-tomato">Please fill in name, phone and address.</p>
            )}
            {!PAYPAL_CLIENT_ID ? (
              <p className="rounded-lg bg-tomato-soft px-3 py-2 text-sm text-tomato">
                PayPal is not configured. Add <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> to{" "}
                <code>.env.local</code> (see README).
              </p>
            ) : (
              <PayPalScriptProvider
                options={{ clientId: PAYPAL_CLIENT_ID, currency: "EUR", intent: "capture" }}
              >
                <PayPalButtons
                  style={{ layout: "vertical", shape: "pill", label: "pay" }}
                  onClick={(_data, actions) => {
                    setTouched(true);
                    setError(null);
                    return isCustomerValid(checkoutRef.current.customer)
                      ? actions.resolve()
                      : actions.reject();
                  }}
                  createOrder={async () => {
                    const res = await fetch("/api/orders", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(checkoutRef.current),
                    });
                    const json = await res.json();
                    if (!res.ok) {
                      setError(json.error ?? "Could not create order");
                      throw new Error(json.error);
                    }
                    orderIdRef.current = json.orderId;
                    return json.paypalOrderId;
                  }}
                  onApprove={async () => {
                    const id = orderIdRef.current;
                    const res = await fetch(`/api/orders/${id}/capture`, { method: "POST" });
                    const json = await res.json();
                    if (!res.ok) {
                      setError(json.error ?? "Payment could not be captured");
                      return;
                    }
                    clear();
                    router.push(`/order?id=${encodeURIComponent(id ?? "")}`);
                  }}
                  onCancel={() => setError("Payment cancelled — your cart is still here.")}
                  onError={(err) => {
                    console.error(err);
                    setError((e) => e ?? "Something went wrong with PayPal. Please try again.");
                  }}
                />
              </PayPalScriptProvider>
            )}
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted">
          Sandbox mode — use a PayPal sandbox buyer account. No real money is charged.
        </p>
      </aside>
    </div>
  );
}

function isCustomerValid(c: Customer) {
  return c.name.trim().length > 1 && c.phone.trim().length > 5 && c.address.trim().length > 5;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "text-base font-semibold" : ""}`}>
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
