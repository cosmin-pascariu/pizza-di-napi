"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./providers";
import { formatEUR } from "@/lib/pricing";
import { LogoMark } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const { count, subtotal } = useCart();
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Pizza di Napi home">
          <LogoMark size={40} />
          <span className="font-script text-[1.9rem] leading-none text-oven sm:text-4xl">Pizza di Napi</span>
          {isAdmin && (
            <span className="rounded-md bg-oven-soft px-2 py-0.5 text-xs font-semibold text-oven">
              Kitchen
            </span>
          )}
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium">
          <ThemeToggle />
          {isAdmin ? (
            <Link href="/" className="rounded-lg px-3 py-2 text-muted hover:bg-flour hover:text-ink">
              View shop
            </Link>
          ) : (
            <>
              <Link
                href="/admin"
                className="hidden rounded-lg px-3 py-2 text-muted hover:bg-flour hover:text-ink sm:block"
              >
                Kitchen
              </Link>
              <Link
                href="/cart"
                className="flex items-center gap-2 rounded-lg bg-ink px-3.5 py-2 text-page"
                aria-label={`Cart, ${count} items`}
              >
                <BagIcon />
                {count > 0 ? (
                  <span className="flex items-center gap-2 tabular-nums">
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-tomato px-1 text-xs text-white">
                      {count}
                    </span>
                    <span className="hidden sm:inline">{formatEUR(subtotal)}</span>
                  </span>
                ) : (
                  <span>Cart</span>
                )}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function BagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 7h12l1 13H5L6 7Z" strokeLinejoin="round" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}
