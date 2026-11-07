"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers";
import { MenuCard } from "@/components/menu-card";
import { CartPanel } from "@/components/cart-panel";
import { ChatAssistant, openSlicey } from "@/components/chat-assistant";
import { formatEUR } from "@/lib/pricing";
import type { Category } from "@/lib/types";

const SECTIONS: { id: Category; title: string; blurb: string }[] = [
  { id: "pizza", title: "Pizza", blurb: "48-hour dough, baked for 90 seconds at 450 °C." },
  { id: "sides", title: "Sides", blurb: "Something to share while the pizza is in the oven." },
  { id: "drinks", title: "Drinks", blurb: "Made fresh or served ice-cold." },
  { id: "desserts", title: "Desserts", blurb: "Made in-house every morning." },
];

export default function MenuPage() {
  const { menu, menuLoaded, lines, add, setQty, count, subtotal } = useCart();
  const qty = (id: string) => lines.find((l) => l.itemId === id)?.quantity ?? 0;

  return (
    <>
      <Hero />

      <nav
        aria-label="Menu sections"
        className="sticky top-16 z-20 border-b border-line bg-page/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-muted hover:bg-flour hover:text-ink"
            >
              {s.title}
            </a>
          ))}
          <button
            onClick={openSlicey}
            className="ml-auto hidden shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-oven hover:bg-oven-soft sm:block"
          >
            Not sure? Ask Slicey
          </button>
        </div>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div id="menu" className="min-w-0 scroll-mt-32 space-y-14">
          {SECTIONS.map((section) => {
            const items = menu.filter((m) => m.available && m.category === section.id);
            if (menuLoaded && items.length === 0) return null;
            return (
              <section key={section.id} id={section.id} className="scroll-mt-32">
                <header className="mb-2 sm:mb-6">
                  <h2 className="font-display text-3xl text-oven sm:text-4xl">{section.title}</h2>
                  <p className="mt-1 text-muted">{section.blurb}</p>
                </header>
                <div className="grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 xl:grid-cols-3">
                  {!menuLoaded
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="my-2 h-28 animate-pulse rounded-xl bg-flour sm:my-0 sm:h-64" />
                      ))
                    : items.map((item, i) => (
                        <MenuCard
                          key={item.id}
                          item={item}
                          quantity={qty(item.id)}
                          onAdd={() => add(item.id)}
                          onChange={(n) => setQty(item.id, n)}
                          priority={section.id === "pizza" && i < 3}
                        />
                      ))}
                </div>
              </section>
            );
          })}

          <p className="rounded-xl border border-line px-4 py-3 text-sm leading-relaxed text-muted">
            Calories are approximate and refer to the whole portion. All our doughs use Caputo
            Pizzeria 00 flour, rested for 48 hours. Our kitchen also handles nuts and sesame, so
            traces are possible. If you have an allergy, write it in the notes for the courier at
            checkout.
          </p>

          <About />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <CartPanel />
          </div>
        </aside>
      </div>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-page/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
          <Link
            href="/cart"
            className="mx-auto flex max-w-xl items-center justify-between rounded-xl bg-tomato px-5 py-3.5 font-semibold text-white"
          >
            <span>
              Checkout, {count} {count === 1 ? "item" : "items"}
            </span>
            <span className="tabular-nums">{formatEUR(subtotal)}</span>
          </Link>
        </div>
      )}

      <ChatAssistant />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#1a1410]">
      <Image
        src="/images/hero.webp"
        alt="A Neapolitan pizza baking next to the flames of a wood-fired oven"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-[60%_center] opacity-90"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/10 md:bg-gradient-to-r md:from-black/80 md:via-black/40 md:to-transparent" />

      <div className="mx-auto flex min-h-[460px] max-w-6xl flex-col justify-end px-4 pb-10 pt-32 text-white sm:px-6 md:min-h-[560px] md:justify-center md:pb-16">
        <h1 className="max-w-3xl font-script text-[3.6rem] leading-[1.05] whitespace-nowrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-8xl md:text-9xl">Pizza di Napi</h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-white/90">
          Neapolitan pizza from a wood-fired oven, at your door in about 30 minutes.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#menu"
            className="rounded-lg bg-tomato px-5 py-3 font-semibold text-white transition hover:brightness-110"
          >
            See the menu
          </a>
          <button
            onClick={openSlicey}
            className="rounded-lg bg-white/15 px-5 py-3 font-semibold text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-white/25"
          >
            Let Slicey pick for me
          </button>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
          <li>Open every day from 12:00</li>
          <li>Free delivery over €30</li>
          <li>Pay securely with PayPal</li>
        </ul>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="grid overflow-hidden rounded-2xl bg-flour md:grid-cols-2">
      <div className="relative aspect-[4/3] md:aspect-auto">
        <Image
          src="/images/about.webp"
          alt="A freshly baked pizza on a wooden board in front of the oven"
          fill
          sizes="(min-width: 768px) 420px, 100vw"
          className="object-cover"
        />
      </div>
      <div className="p-6 sm:p-8">
        <h2 className="font-display text-3xl text-oven">Slow dough, fast oven</h2>
        <p className="mt-3 leading-relaxed text-muted">
          Our dough rests for 48 hours before it meets a 450 °C wood fire. Ninety seconds later it
          comes out soft, blistered and light. We use San Marzano tomatoes, fior di latte from a
          small dairy and basil we grow ourselves.
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          Ordering for a group? Tell Slicey how many you are and what you like, and it will build
          the order for you.
        </p>
      </div>
    </section>
  );
}
