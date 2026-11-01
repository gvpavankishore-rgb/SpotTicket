"use client";

import { formatPrice } from "@/lib/format";
import {
  SEAT_CATEGORIES,
  SEATS_PER_ROW,
  getCategoryPrice,
  getSeatCategory,
} from "@/lib/seats";

interface HallMiniMapProps {
  basePrice: number;
  bookedSeats: Set<string>;
  selectedSeats: Set<string>;
  activeSeat: string | null;
}

export default function HallMiniMap({
  basePrice,
  bookedSeats,
  selectedSeats,
  activeSeat,
}: HallMiniMapProps) {
  const activeCategoryId = activeSeat
    ? getSeatCategory(activeSeat).id
    : null;

  return (
    <section className="rounded-3xl border border-white/[0.06] bg-surface/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Hall overview
        </p>
        <span className="text-[9px] font-medium text-zinc-600">
          {selectedSeats.size} selected
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        {SEAT_CATEGORIES.map((category) => {
          const isActive = category.id === activeCategoryId;

          return (
            <div
              key={category.id}
              className={`rounded-lg border p-2 transition-colors ${
                isActive
                  ? "border-accent/35 bg-accent/[0.07]"
                  : "border-white/[0.05] bg-white/[0.015]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  {category.name}
                </span>
                <span className="text-[9px] font-bold text-accent">
                  {formatPrice(getCategoryPrice(basePrice, category))}
                </span>
              </div>

              <div className="mt-1.5 space-y-[2px]">
                {category.rows.map((row) => (
                  <div key={row} className="flex gap-[2px]">
                    {Array.from(
                      { length: SEATS_PER_ROW },
                      (_, index) => {
                        const seatId = `${row}${index + 1}`;
                        const isSelected = selectedSeats.has(seatId);
                        const isBooked = bookedSeats.has(seatId);

                        return (
                          <span
                            key={seatId}
                            className={`h-1 flex-1 rounded-full ${
                              isSelected
                                ? "bg-accent"
                                : isBooked
                                  ? "bg-white/[0.06]"
                                  : "bg-zinc-600/70"
                            }`}
                          />
                        );
                      },
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
        <span className="text-[8px] font-semibold uppercase tracking-[0.24em] text-accent/60">
          Screen
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-accent/50 to-transparent" />
      </div>
    </section>
  );
}
