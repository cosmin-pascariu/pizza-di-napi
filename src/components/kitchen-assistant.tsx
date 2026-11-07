"use client";

import { useState } from "react";

const EXAMPLES = [
  "Diavola is €11 from today",
  "We're out of tiramisu tonight",
  "Add a Tonno pizza: tuna, red onion, €10.5",
  "What sold best today?",
];

interface Exchange {
  instruction: string;
  reply: string;
  changes: string[];
  error?: boolean;
}

export function KitchenAssistant() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Exchange[]>([]);

  async function run(instruction: string) {
    const text = instruction.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput("");
    try {
      const res = await fetch("/api/kitchen/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: text }),
      });
      const json = await res.json();
      setHistory((h) => [
        res.ok
          ? { instruction: text, reply: json.reply, changes: json.changes ?? [] }
          : {
              instruction: text,
              reply: json.error ?? "The assistant is unavailable right now.",
              changes: [],
              error: true,
            },
        ...h,
      ]);
    } catch {
      setHistory((h) => [
        { instruction: text, reply: "Network error, please try again.", changes: [], error: true },
        ...h,
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-line bg-card p-3">
      <h2 className="text-sm font-medium">✨ Menu assistant</h2>
      <p className="text-xs text-muted">Change the menu or ask about today&apos;s sales in plain words.</p>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Margherita is sold out"
          maxLength={500}
          className="min-w-0 flex-1 rounded-lg border border-line bg-page px-3 py-2 outline-none focus:border-oven"
        />
        <button
          disabled={busy || !input.trim()}
          className="rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "…" : "Go"}
        </button>
      </form>
      {history.length === 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              onClick={() => run(e)}
              disabled={busy}
              className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:border-oven hover:text-oven"
            >
              {e}
            </button>
          ))}
        </div>
      )}
      {busy && <p className="mt-2 animate-pulse text-xs text-muted">Working on it…</p>}
      <ul className="mt-2 space-y-2">
        {history.slice(0, 3).map((ex, i) => (
          <li key={i} className="rounded-xl bg-cream p-2.5 text-sm">
            <p className="text-xs text-muted">“{ex.instruction}”</p>
            <p className={`mt-1 ${ex.error ? "text-tomato" : ""}`}>{ex.reply}</p>
            {ex.changes.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {ex.changes.map((c, j) => (
                  <li key={j} className="w-fit rounded-full bg-basil-soft px-2 py-0.5 text-xs text-basil">
                    ✓ {c}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
