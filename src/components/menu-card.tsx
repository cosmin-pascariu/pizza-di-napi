"use client";

import Image from "next/image";
import { Stepper } from "./stepper";
import { formatEUR } from "@/lib/pricing";
import { ALLERGEN_LABEL, type MenuItem } from "@/lib/types";

const TAG_LABEL: Record<MenuItem["tags"][number], string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  spicy: "Spicy",
  bestseller: "Popular",
};

const TAG_STYLE: Record<MenuItem["tags"][number], string> = {
  vegetarian: "text-oven",
  vegan: "text-oven",
  spicy: "text-tomato",
  bestseller: "text-ink",
};

export function MenuCard({
  item,
  quantity,
  onAdd,
  onChange,
  priority,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onChange: (n: number) => void;
  priority?: boolean;
}) {
  // "vegan" already implies vegetarian; don't show both.
  const tags = item.tags.filter((t) => !(t === "vegetarian" && item.tags.includes("vegan")));

  return (
    <article className="group flex gap-4 border-b border-line py-4 sm:flex-col sm:gap-3 sm:border-0 sm:py-0">
      <div className="relative aspect-square w-28 shrink-0 self-start overflow-hidden rounded-xl bg-flour sm:aspect-[4/3] sm:w-full">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 112px"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            priority={priority}
          />
        ) : (
          <span className="grid h-full place-items-center text-5xl">{item.emoji}</span>
        )}
        {quantity > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-page">
            {quantity} in cart
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold leading-snug">{item.name}</h3>
          <span className="shrink-0 font-semibold tabular-nums">{formatEUR(item.price)}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>

        {(item.kcal || item.flour) && (
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink/80">
            {item.kcal && (
              <span title="Approximate energy for the whole portion">
                ≈ {item.kcal} kcal{item.portion ? ` per ${item.portion}` : ""}
              </span>
            )}
            {item.flour && <span>{item.flour} flour</span>}
          </p>
        )}
        {item.allergens && (
          <p className="mt-1 text-xs text-muted">
            {item.allergens.length > 0
              ? `Allergens: ${item.allergens.map((a) => ALLERGEN_LABEL[a]).join(", ")}`
              : "No major allergens"}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
            {tags.map((t) => (
              <span key={t} className={TAG_STYLE[t]}>
                {TAG_LABEL[t]}
              </span>
            ))}
          </p>
          {quantity === 0 ? (
            <button
              onClick={onAdd}
              className="shrink-0 rounded-lg bg-tomato px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
              aria-label={`Add ${item.name} to cart`}
            >
              Add
            </button>
          ) : (
            <Stepper value={quantity} onChange={onChange} label={item.name} />
          )}
        </div>
      </div>
    </article>
  );
}
