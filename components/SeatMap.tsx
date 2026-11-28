"use client";

import { X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import {
  SEAT_CATEGORIES,
  SEATS_PER_ROW,
  getCategoryPrice,
  isBestSeat,
} from "@/lib/seats";

interface SeatMapProps {
  basePrice: number;
  bookedSeats: Set<string>;
  selectedSeats: Set<string>;
  isProcessing: boolean;
  isLocked?: boolean;
  is3D?: boolean;
  onToggleSeat: (seat: string) => void;
}

const legendItems = [
  { label: "Available", variant: "available" },
  { label: "Occupied", variant: "occupied" },
  { label: "Selected", variant: "selected" },
  { label: "Best seats", variant: "best" },
] as const;

function SeatSwatch({
  variant,
  className = "",
}: {
  variant: "available" | "occupied" | "selected" | "best";
  className?: string;
}) {
  return (
    <span
      className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded-t-[4px] rounded-b-[2px] border ${
        variant === "selected"
          ? "border-amber-300 bg-gradient-to-b from-amber-300 to-accent"
          : variant === "occupied"
            ? "border-white/[0.04] bg-white/[0.02] text-zinc-700"
            : variant === "best"
              ? "border-accent/40 bg-[#1d1a12]"
              : "border-white/10 bg-zinc-800"
      } ${className}`}
    >
      {variant === "occupied" && (
        <X className="h-2.5 w-2.5" strokeWidth={2.5} />
      )}
      {variant === "best" && (
        <span className="h-1 w-1 rounded-full bg-accent shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
      )}
    </span>
  );
}

export default function SeatMap({
  basePrice,
  bookedSeats,
  selectedSeats,
  isProcessing,
  isLocked = false,
  is3D = false,
  onToggleSeat,
}: SeatMapProps) {
  return (
    <div className={is3D ? "relative" : undefined}>
      {is3D && (
        <div className="pointer-events-none absolute inset-x-[8%] top-10 h-40 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      )}
      <div className="no-scrollbar overflow-x-auto pb-2">
        <div
          className={`mx-auto w-max min-w-full px-1 ${is3D ? "origin-top [transform:perspective(1200px)_rotateX(14deg)_scale(0.985)] sm:[transform:perspective(1400px)_rotateX(16deg)_scale(1)]" : ""}`}
          style={is3D ? { transformStyle: "preserve-3d" } : undefined}
        >
          {SEAT_CATEGORIES.map((category) => {
            const categoryPrice = getCategoryPrice(basePrice, category);
            const availableCount = category.rows.reduce(
              (count, row) =>
                count +
                Array.from({ length: SEATS_PER_ROW }).filter((_, index) => {
                  const seatId = `${row}${index + 1}`;
                  return (
                    !bookedSeats.has(seatId) && !selectedSeats.has(seatId)
                  );
                }).length,
              0,
            );

            return (
              <div
                key={category.id}
                className="mt-5 first:mt-0"
                aria-label={`${category.name} seating`}
              >
                <div className="flex items-center gap-2 px-2">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                  <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      {category.name}
                    </span>
                    <span className="h-2.5 w-px bg-white/10" />
                    <span className="text-[10px] font-bold text-accent">
                      {formatPrice(categoryPrice)}
                    </span>
                    <span className="hidden text-[9px] text-zinc-600 min-[390px]:inline">
                      {availableCount} left
                    </span>
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                </div>

                <div className="mt-2.5 space-y-[5px]">
                  {category.rows.map((row) => (
                    <div
                      key={row}
                      className="flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                      <span className="w-3.5 shrink-0 text-center text-[9px] font-semibold text-zinc-500">
                        {row}
                      </span>

                      <div className="flex gap-[3px] sm:gap-1.5">
                        {Array.from(
                          { length: SEATS_PER_ROW },
                          (_, index) => {
                            const seatNumber = index + 1;
                            const seatId = `${row}${seatNumber}`;
                            const isBooked = bookedSeats.has(seatId);
                            const isSelected = selectedSeats.has(seatId);
                            const isBest =
                              !isBooked &&
                              !isSelected &&
                              isBestSeat(seatId);

                            return (
                              <button
                                key={seatId}
                                type="button"
                                onClick={() => onToggleSeat(seatId)}
                                disabled={
                                  isBooked || isProcessing || isLocked
                                }
                                aria-pressed={isSelected}
                                aria-label={`Seat ${seatId}, ${category.name}, ${formatPrice(
                                  categoryPrice,
                                )}${
                                  isBooked
                                    ? ", occupied"
                                    : isLocked
                                      ? ", bookings closed"
                                      : isSelected
                                        ? ", selected"
                                        : isBest
                                          ? ", best seat"
                                          : ", available"
                                }`}
                                title={
                                  isLocked
                                    ? "Bookings are closed for this show"
                                    : isBooked
                                      ? `Seat ${seatId} is already booked`
                                      : `Seat ${seatId} · ${category.name} · ${formatPrice(
                                          categoryPrice,
                                        )}`
                                }
                                className={`seat-map-button relative flex h-6 w-6 shrink-0 touch-manipulation items-center justify-center rounded-t-[6px] rounded-b-[3px] border text-[8px] font-semibold transition-all duration-200 sm:h-8 sm:w-8 sm:text-[9px] lg:h-9 lg:w-9 lg:text-[10px] ${
                                  isBooked
                                    ? "cursor-not-allowed border-white/[0.04] bg-white/[0.02] text-zinc-700"
                                    : isSelected
                                      ? `seat-button--selected border-amber-200 bg-gradient-to-b from-amber-200 via-amber-300 to-accent text-black ${is3D ? "scale-110 shadow-[0_0_0_1px_rgba(251,191,36,0.6),0_10px_22px_rgba(245,158,11,0.45),0_0_28px_rgba(245,158,11,0.55)] -translate-y-0.5" : "scale-105 shadow-[0_0_14px_rgba(245,158,11,0.35)]"}`
                                      : isBest
                                        ? `border-accent/35 bg-[#1d1a12] text-amber-200/90 hover:-translate-y-0.5 hover:border-accent hover:bg-accent/20 ${is3D ? "shadow-[0_0_12px_rgba(245,158,11,0.12)]" : ""}`
                                        : `border-white/10 bg-zinc-800/80 text-zinc-400 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-zinc-700 hover:text-white ${is3D ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : ""}`
                                } ${
                                  isLocked && !isBooked
                                    ? "cursor-not-allowed opacity-50"
                                    : isProcessing && !isBooked
                                      ? "disabled:cursor-wait"
                                      : ""
                                }`}
                              >
                                {isBooked ? (
                                  <X
                                    className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                                    strokeWidth={2.5}
                                  />
                                ) : (
                                  seatNumber
                                )}

                                {isBest && (
                                  <span className="absolute -right-0.5 -top-0.5 h-1 w-1 rounded-full bg-accent shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
                                )}
                              </button>
                            );
                          },
                        )}
                      </div>

                      <span className="hidden w-3.5 shrink-0 text-center text-[9px] font-semibold text-zinc-500 sm:block">
                        {row}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="mx-auto mt-7 max-w-lg px-8 pb-1">
            <div className={`${is3D ? "h-1.5 shadow-[0_0_40px_rgba(245,158,11,0.5)]" : "h-1 shadow-[0_0_28px_rgba(245,158,11,0.32)]"} rounded-[100%] bg-gradient-to-r from-transparent via-accent/80 to-transparent`} />
            <p className="mt-2 text-center text-[9px] font-semibold uppercase tracking-[0.38em] text-accent/70">
              {is3D ? "3D screen this way" : "Screen this way"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-white/[0.06] pt-4 text-[10px] text-zinc-400 sm:text-[11px]">
        {legendItems.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            <SeatSwatch variant={item.variant} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
