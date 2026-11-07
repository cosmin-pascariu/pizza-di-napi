"use client";

import { LogoMark } from "./logo";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-16 border-t border-line bg-flour pb-28 pt-10 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 text-sm sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark size={44} />
            <p className="font-script text-4xl leading-none text-oven">Pizza di Napi</p>
          </div>
          <p className="mt-2 max-w-xs text-muted">
            Neapolitan pizza baked at 450 °C in a wood-fired oven, delivered across the city.
          </p>
        </div>
        <div>
          <p className="font-semibold">Opening hours</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-muted">
            <dt>Mon – Thu</dt>
            <dd>12:00 – 22:30</dd>
            <dt>Fri – Sun</dt>
            <dd>12:00 – 23:30</dd>
          </dl>
        </div>
        <div>
          <p className="font-semibold">Delivery</p>
          <p className="mt-2 text-muted">
            Usually 25–35 minutes. €2.50, free on orders over €30. Secure payment with PayPal.
          </p>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-4 text-xs text-muted sm:px-6">
        Pizza di Napi is a demo built for the PayPal AI Hackathon. Food photography from{" "}
        <a
          href="https://unsplash.com/?utm_source=pizza_di_napi&utm_medium=referral"
          className="underline underline-offset-2 hover:text-ink"
        >
          Unsplash
        </a>
        , credited in the project README.
      </p>
    </footer>
  );
}
