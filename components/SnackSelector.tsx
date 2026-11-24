"use client";

import { Minus, Plus, Popcorn, Sparkles } from "lucide-react";
import {
  MAX_SNACK_QUANTITY,
  calculateSnackTotal,
  type PricedSnack,
  type Snack,
} from "@/lib/snacks";
import { formatPrice } from "@/lib/format";

interface SnackSelectorProps {
  snacks: Snack[];
  quantities: Record<string, number>;
  disabled?: boolean;
  onQuantityChange: (snackId: string, quantity: number) => void;
  onSkip: () => void;
}

function getImageStyle(imageUrl: string | null) {
  if (!imageUrl) {
    return undefined;
  }

  try {
    const parsed = new URL(imageUrl);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }

    const escaped = parsed.href.replace(/["'()\\]/g, "\\$&");
    return { backgroundImage: `url("${escaped}")` };
  } catch {
    return undefined;
  }
}

export default function SnackSelector({
  snacks,
  quantities,
  disabled = false,
  onQuantityChange,
  onSkip,
}: SnackSelectorProps) {
  const selectedItems: PricedSnack[] = snacks.flatMap((snack) => {
    const quantity = quantities[snack.id] ?? 0;

    return quantity > 0
      ? [
          {
            id: snack.id,
            name: snack.name,
            price: snack.price,
            image_url: snack.image_url,
            quantity,
          },
        ]
      : [];
  });
  const snackTotal = calculateSnackTotal(selectedItems);

  return (
    <section className="rounded-3xl border border-white/[0.06] bg-surface/80 p-3 shadow-[0_35px_90px_-60px_rgba(0,0,0,0.95)] backdrop-blur-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 px-1 sm:px-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-5 bg-accent" />
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
              Add Snacks &amp; Drinks
            </h2>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-500 sm:text-xs">
            Make it a movie night. Snacks are optional and added to your ticket
            total.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent">
            Optional
          </span>
          <button
            type="button"
            onClick={onSkip}
            disabled={disabled}
            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-zinc-400 transition-colors hover:border-accent/30 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            Skip snacks
          </button>
        </div>
      </div>

      {snacks.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
            <Popcorn className="h-4 w-4" />
          </span>
          <p className="text-xs leading-relaxed text-zinc-500">
            Snacks are not available right now. You can continue to payment.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {snacks.map((snack) => {
            const quantity = quantities[snack.id] ?? 0;
            const imageStyle = getImageStyle(snack.image_url);

            return (
              <div
                key={snack.id}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors sm:px-3.5 ${
                  quantity > 0
                    ? "border-accent/35 bg-accent/[0.06]"
                    : "border-white/[0.06] bg-black/20 hover:border-white/[0.12]"
                }`}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-cover bg-center text-accent/70"
                  style={{
                    ...(imageStyle ?? {}),
                    ...(imageStyle
                      ? {}
                      : {
                          backgroundImage:
                            "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(0,0,0,0.4))",
                        }),
                  }}
                  aria-hidden="true"
                >
                  {!imageStyle && <Popcorn className="h-5 w-5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">
                    {snack.name}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-accent">
                    {formatPrice(snack.price)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-600">
                    {formatPrice(snack.price * quantity)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/[0.08] bg-black/30 p-1">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(snack.id, quantity - 1)}
                    disabled={disabled || quantity === 0}
                    aria-label={`Remove one ${snack.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span
                    className="w-5 text-center text-xs font-bold text-white"
                    aria-live="polite"
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onQuantityChange(snack.id, quantity + 1)}
                    disabled={disabled || quantity >= MAX_SNACK_QUANTITY}
                    aria-label={`Add one ${snack.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {snacks.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-1 pt-3 sm:px-0">
          <p className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <Sparkles className="h-3 w-3 text-accent" />
            {selectedItems.length === 0
              ? "No snacks selected"
              : `${selectedItems.length} snack${selectedItems.length === 1 ? "" : "s"} added`}
          </p>
          <p className="text-xs font-semibold text-accent">
            {formatPrice(snackTotal)}
          </p>
        </div>
      )}
    </section>
  );
}
