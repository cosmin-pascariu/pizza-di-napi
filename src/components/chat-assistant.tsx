"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useCart } from "./providers";
import { formatEUR } from "@/lib/pricing";
import type { AssistantMessage, CartToolOutput } from "@/lib/ai/cart-tools";
import type { CartLine } from "@/lib/types";

const SUGGESTIONS = [
  "We're 4 people, one is vegetarian, budget €40",
  "Something spicy for 2 with drinks",
  "Surprise me with a dinner for one under €15",
];

const OPEN_EVENT = "slicey:open";
/** Opens the assistant from anywhere on the page (hero button, menu nav). */
export function openSlicey() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

// Sent with every chat request so the assistant knows what's already in the cart.
const cartSnapshot: { lines: CartLine[] } = { lines: [] };
const transport = new DefaultChatTransport<AssistantMessage>({
  api: "/api/chat",
  body: () => ({ cart: cartSnapshot.lines }),
});

export function ChatAssistant() {
  const cart = useCart();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // The chat callbacks are created once; read the latest cart/menu through a ref.
  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
    cartSnapshot.lines = cart.lines;
  }, [cart]);


  const { messages, sendMessage, addToolOutput, status, error, stop } = useChat<AssistantMessage>({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;
      const { menu, lines, add, setQty, clear } = cartRef.current;
      let output: CartToolOutput;

      if (toolCall.toolName === "go_to_checkout") {
        if (lines.length === 0) {
          output = { ok: false, message: "The cart is empty" };
        } else {
          output = { ok: true, message: "Opening checkout" };
          setOpen(false);
          router.push("/cart");
        }
      } else if (toolCall.toolName === "clear_cart") {
        clear();
        output = { ok: true, message: "Cart cleared" };
      } else {
        const { itemId, quantity } = toolCall.input;
        const item = menu.find((m) => m.id === itemId && m.available);
        if (!item) {
          output = { ok: false, message: `Unknown or unavailable item id: ${itemId}` };
        } else if (toolCall.toolName === "add_to_cart") {
          add(item.id, quantity);
          output = { ok: true, message: `Added ${quantity}× ${item.name}` };
        } else {
          const had = lines.find((l) => l.itemId === item.id)?.quantity ?? 0;
          setQty(item.id, quantity);
          output = {
            ok: true,
            message:
              quantity === 0 ? `Removed ${item.name}` : `${item.name}: ${had} → ${quantity}`,
          };
        }
      }
      // No await: avoids deadlocks with automatic resubmission.
      addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output });
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  const notConfigured = error?.message.includes("not configured");

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed right-4 z-30 flex items-center gap-2 rounded-full bg-brand py-2.5 pl-2.5 pr-4 font-semibold text-white shadow-lg shadow-black/20 transition active:scale-95 sm:right-6 lg:bottom-6 ${
            cart.count > 0 ? "bottom-24" : "bottom-[max(1.5rem,env(safe-area-inset-bottom))]"
          }`}
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15" aria-hidden>
            <SparkIcon />
          </span>
          Ask Slicey
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 md:items-center">
          <button aria-label="Close assistant" className="absolute inset-0" onClick={() => setOpen(false)} />
          <section
            role="dialog"
            aria-label="Ordering assistant"
            className="relative flex h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-page shadow-2xl md:h-[72vh] md:rounded-2xl"
          >
            <header className="flex items-center gap-3 bg-brand px-4 py-3.5 text-white">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15" aria-hidden>
                <SparkIcon />
              </span>
              <div className="flex-1">
                <p className="font-display text-xl leading-tight">Slicey</p>
                <p className="text-xs text-white/75">Tells you what to order and adds it to your cart</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                Close
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="rounded-2xl rounded-tl-sm bg-flour p-3 text-sm leading-relaxed">
                    Hi! Tell me who you&apos;re ordering for, any dietary needs and your budget, and
                    I&apos;ll put together the order. 🍕
                  </p>
                  <div className="flex flex-col items-start gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-lg border border-line bg-card px-3 py-2 text-left text-sm hover:border-oven hover:text-oven"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                  <div className={m.role === "user" ? "max-w-[85%]" : "max-w-[92%] space-y-1.5"}>
                    {m.parts.map((part, i) => {
                      if (part.type === "text") {
                        if (!part.text.trim()) return null;
                        return (
                          <p
                            key={i}
                            className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                              m.role === "user" ? "rounded-tr-sm bg-ink text-page" : "rounded-tl-sm bg-flour"
                            }`}
                          >
                            {part.text}
                          </p>
                        );
                      }
                      if (
                        part.type === "tool-add_to_cart" ||
                        part.type === "tool-set_quantity" ||
                        part.type === "tool-go_to_checkout" ||
                        part.type === "tool-clear_cart"
                      ) {
                        const out = part.state === "output-available" ? part.output : null;
                        return (
                          <p
                            key={part.toolCallId}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                              out && !out.ok ? "bg-tomato-soft text-tomato" : "bg-basil-soft text-basil"
                            }`}
                          >
                            {out ? (out.ok ? "✓ " : "✕ ") + out.message : "Updating your cart…"}
                          </p>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}

              {status === "submitted" && (
                <p className="w-fit animate-pulse rounded-2xl rounded-tl-sm bg-flour px-3 py-2 text-sm text-muted">
                  Thinking…
                </p>
              )}
              {error && (
                <p className="rounded-2xl bg-tomato-soft px-3 py-2 text-sm text-tomato">
                  {notConfigured
                    ? "The AI assistant isn't configured yet (missing Gemini API key). You can still order from the menu."
                    : "Slicey is busy right now (the free AI quota may be exhausted). Please try again in a minute or order from the menu."}
                </p>
              )}
            </div>

            {cart.count > 0 && (
              <div className="flex items-center justify-between border-t border-line px-4 py-2 text-sm">
                <span>
                  {cart.count} {cart.count === 1 ? "item" : "items"}, {formatEUR(cart.subtotal)}
                </span>
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-tomato px-4 py-2 font-semibold text-white"
                >
                  Go to checkout
                </Link>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. 3 pizzas, one vegan…"
                maxLength={500}
                className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3.5 py-2.5 outline-none focus:border-oven"
              />
              {busy ? (
                <button type="button" onClick={stop} className="rounded-lg bg-ink px-4 text-sm font-semibold text-page">
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Send
                </button>
              )}
            </form>
          </section>
        </div>
      )}
    </>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z" />
      <path d="M19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14z" opacity=".7" />
    </svg>
  );
}
