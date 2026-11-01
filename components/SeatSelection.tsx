"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Armchair,
  Building2,
  CalendarDays,
  Clock,
  Eye,
  Film,
  Loader2,
  LockKeyhole,
  MapPin,
  Ticket,
  X,
} from "lucide-react";
import HallMiniMap from "@/components/HallMiniMap";
import SeatMap from "@/components/SeatMap";
import SeatViewPreview from "@/components/SeatViewPreview";
import { formatPrice, getErrorMessage } from "@/lib/format";
import {
  MAX_SEATS_PER_BOOKING,
  SEAT_CATEGORIES,
  SEAT_ROWS,
  SEATS_PER_ROW,
  calculateSeatTotal,
  getSeatCategory,
  getSeatPrice,
} from "@/lib/seats";
import { isShowBookingClosed } from "@/lib/show-time";

const RAZORPAY_SCRIPT_ID = "razorpay-checkout-js";

export interface ShowtimeOption {
  id: string;
  label: string;
}

interface SeatSelectionProps {
  price: number;
  movieTitle: string;
  movieMeta?: string | null;
  moviePosterUrl?: string | null;
  trailerUrl?: string | null;
  showId: string;
  showDate: string;
  showTime: string;
  theatreName: string;
  theatreLocation?: string | null;
  showDateLabel: string;
  showTimeLabel: string;
  showLabel: string;
  showtimeOptions: ShowtimeOption[];
  bookingClosed?: boolean;
  isLoggedIn: boolean;
  userEmail: string | null;
  userPhone: string | null;
  bookedSeats?: string[];
}

interface OrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  description: string;
}

interface ApiError {
  error?: string;
}

function sortSeats(seats: string[]) {
  return [...seats].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}

async function readJson<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function loadRazorpayCheckout() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.getElementById(
      RAZORPAY_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), {
        once: true,
      });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function SeatSelection({
  price,
  movieTitle,
  movieMeta,
  moviePosterUrl,
  trailerUrl,
  showId,
  showDate,
  showTime,
  theatreName,
  theatreLocation,
  showDateLabel,
  showTimeLabel,
  showLabel,
  showtimeOptions,
  bookingClosed = false,
  isLoggedIn,
  userEmail,
  userPhone,
  bookedSeats = [],
}: SeatSelectionProps) {
  const router = useRouter();
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSeat, setPreviewSeat] = useState<string | null>(null);
  const [showClosedNow, setShowClosedNow] = useState(bookingClosed);

  useEffect(() => {
    setShowClosedNow(bookingClosed);
  }, [bookingClosed]);

  useEffect(() => {
    if (bookingClosed) {
      return;
    }

    const updateClosedState = () =>
      setShowClosedNow(isShowBookingClosed(showDate, showTime));

    updateClosedState();
    const interval = window.setInterval(updateClosedState, 15_000);

    return () => window.clearInterval(interval);
  }, [bookingClosed, showDate, showTime]);

  const isLocked = bookingClosed || showClosedNow;

  const bookedSeatSet = useMemo(
    () => new Set(bookedSeats.map((seat) => seat.toUpperCase())),
    [bookedSeats],
  );
  const totalSeats = SEAT_ROWS.length * SEATS_PER_ROW;
  const availableSeats = Math.max(
    0,
    totalSeats - bookedSeatSet.size - selectedSeats.size,
  );
  const selectedList = useMemo(
    () => sortSeats(Array.from(selectedSeats)),
    [selectedSeats],
  );
  const latestSelectedSeat = useMemo(() => {
    const selectionOrder = Array.from(selectedSeats);
    return selectionOrder.length > 0
      ? selectionOrder[selectionOrder.length - 1]
      : null;
  }, [selectedSeats]);
  const selectedDetails = useMemo(
    () =>
      selectedList.map((seat) => ({
        seat,
        category: getSeatCategory(seat),
        price: getSeatPrice(price, seat),
      })),
    [selectedList, price],
  );
  const totalAmount = useMemo(
    () => calculateSeatTotal(price, selectedList),
    [price, selectedList],
  );
  const categoryBreakdown = useMemo(
    () =>
      SEAT_CATEGORIES.flatMap((category) => {
        const seats = selectedDetails.filter(
          (detail) => detail.category.id === category.id,
        );

        return seats.length > 0
          ? [
              {
                category,
                count: seats.length,
                subtotal: seats.reduce(
                  (sum, detail) => sum + detail.price,
                  0,
                ),
              },
            ]
          : [];
      }),
    [selectedDetails],
  );
  const showtimeTabs =
    showtimeOptions.length > 0
      ? showtimeOptions
      : [{ id: showId, label: showTimeLabel }];

  useEffect(() => {
    setSelectedSeats((current) => {
      const next = new Set(
        Array.from(current).filter((seat) => !bookedSeatSet.has(seat)),
      );

      return next.size === current.size ? current : next;
    });
  }, [bookedSeatSet]);

  useEffect(() => {
    if (previewSeat && !selectedSeats.has(previewSeat)) {
      setPreviewSeat(null);
    }
  }, [previewSeat, selectedSeats]);

  function toggleSeat(seatId: string) {
    if (bookedSeatSet.has(seatId) || isProcessing || isLocked) {
      return;
    }

    if (
      !selectedSeats.has(seatId) &&
      selectedSeats.size >= MAX_SEATS_PER_BOOKING
    ) {
      setError(
        `You can select up to ${MAX_SEATS_PER_BOOKING} seats in one booking.`,
      );
      return;
    }

    setError(null);
    setSelectedSeats((current) => {
      const next = new Set(current);

      if (next.has(seatId)) {
        next.delete(seatId);
      } else {
        next.add(seatId);
      }

      return next;
    });
  }

  async function handleProceed() {
    if (selectedList.length === 0 || isProcessing || isLocked) {
      return;
    }

    setError(null);

    const loginHref = `/login?next=${encodeURIComponent(`/book/${showId}`)}`;

    if (!isLoggedIn) {
      router.push(loginHref);
      return;
    }

    setIsProcessing(true);
    setStatus("Creating your order...");

    try {
      const orderResponse = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          showId,
          seats: selectedList,
        }),
      });
      const orderPayload = await readJson<OrderResponse & ApiError>(
        orderResponse,
      );

      if (orderResponse.status === 401) {
        setIsProcessing(false);
        setStatus(null);
        router.push(loginHref);
        return;
      }

      if (!orderResponse.ok || !orderPayload?.orderId) {
        if (orderResponse.status === 409) {
          router.refresh();
        }

        throw new Error(
          orderPayload?.error ??
            "Could not start payment. Please try again.",
        );
      }

      setStatus("Loading Razorpay Checkout...");
      const isCheckoutReady = await loadRazorpayCheckout();

      if (!isCheckoutReady) {
        throw new Error(
          "Could not load Razorpay Checkout. Check your connection and try again.",
        );
      }

      setStatus("Waiting for payment...");

      let isCheckoutFinished = false;

      const checkout = new window.Razorpay({
        key: orderPayload.keyId,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        name: "SpotTicket",
        description: orderPayload.description,
        order_id: orderPayload.orderId,
        prefill: {
          ...(userEmail ? { email: userEmail } : {}),
          ...(userPhone ? { contact: userPhone } : {}),
        },
        notes: {
          movie: movieTitle,
          theatre: theatreName,
          show: showLabel,
        },
        theme: {
          color: "#f59e0b",
        },
        modal: {
          ondismiss: () => {
            if (isCheckoutFinished) {
              return;
            }

            setIsProcessing(false);
            setStatus(null);
            setError("Payment was cancelled. Your seats are still selected.");
          },
        },
        handler: async (response) => {
          isCheckoutFinished = true;
          setStatus("Confirming your booking...");

          try {
            const bookingResponse = await fetch("/api/bookings", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                showId,
                seats: selectedList,
              }),
            });
            const bookingPayload = await readJson<{ bookingId?: string } & ApiError>(
              bookingResponse,
            );

            if (!bookingResponse.ok || !bookingPayload?.bookingId) {
              if (bookingResponse.status === 409) {
                router.refresh();
              }

              throw new Error(
                bookingPayload?.error ??
                  "Payment was received, but we could not save your booking. Please contact support.",
              );
            }

            setStatus("Redirecting to your ticket...");
            router.push(
              `/booking/success?id=${encodeURIComponent(
                bookingPayload.bookingId,
              )}`,
            );
          } catch (bookingError) {
            setIsProcessing(false);
            setStatus(null);
            setError(
              getErrorMessage(
                bookingError,
                "Payment was received, but we could not save your booking. Please contact support.",
              ),
            );
          }
        },
      });

      checkout.on("payment.failed", (failure) => {
        isCheckoutFinished = true;
        setIsProcessing(false);
        setStatus(null);
        setError(
          failure.error?.description ??
            "Payment failed. Please try again with another method.",
        );
      });

      checkout.open();
    } catch (orderError) {
      setIsProcessing(false);
      setStatus(null);
      setError(
        getErrorMessage(orderError, "Could not start payment. Please try again."),
      );
    }
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-5">
        {isLocked && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/[0.08] p-4 shadow-[0_20px_50px_-35px_rgba(244,63,94,0.5)] sm:p-5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-300/20 bg-rose-500/10 text-rose-200">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-rose-100">
                Bookings are closed for this show
              </p>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-rose-100/65">
                Tickets close 15 minutes before showtime. Choose another
                showtime above to continue booking.
              </p>
            </div>
          </div>
        )}

        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#1a1509] via-[#12110d] to-[#0b0b0b] p-4 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)] sm:p-5 lg:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
          />

          <div className="relative">
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent sm:h-12 sm:w-12">
                <Film className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="h-px w-5 bg-accent" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                    Select your seats
                  </span>
                </div>

                <h1 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                  {movieTitle}
                </h1>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400 sm:text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                    {theatreName}
                  </span>
                  {theatreLocation && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
                      {theatreLocation}
                    </span>
                  )}
                </div>

                {movieMeta && (
                  <p className="mt-1 text-[10px] text-zinc-500 sm:text-[11px]">
                    {movieMeta}
                  </p>
                )}
              </div>

              <div className="hidden shrink-0 rounded-2xl border border-white/[0.07] bg-black/20 px-3 py-2 text-right sm:block">
                <p className="flex items-center justify-end gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  <CalendarDays className="h-3 w-3 text-accent" />
                  {showDateLabel}
                </p>
                <p className="mt-1 flex items-center justify-end gap-1.5 text-sm font-bold text-white">
                  <Clock className="h-3.5 w-3.5 text-accent" />
                  {showTimeLabel}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-zinc-300">
                <CalendarDays className="h-3 w-3 text-accent" />
                {showDateLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-zinc-300">
                <Clock className="h-3 w-3 text-accent" />
                {showTimeLabel}
              </span>
            </div>

            <div className="mt-4 border-t border-white/[0.06] pt-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Showtime
                </p>
                <p className="text-[10px] text-zinc-600">
                  {showtimeTabs.length}{" "}
                  {showtimeTabs.length === 1 ? "show" : "shows"} Â· switch anytime
                </p>
              </div>

              <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                {showtimeTabs.map((option) => {
                  const isActive = option.id === showId;

                  return (
                    <Link
                      key={option.id}
                      href={`/book/${option.id}`}
                      aria-current={isActive ? "page" : undefined}
                      aria-disabled={isProcessing}
                      tabIndex={isProcessing ? -1 : undefined}
                      className={`flex min-w-[76px] shrink-0 flex-col items-center rounded-xl border px-3 py-2 transition-all duration-200 ${
                        isActive
                          ? "border-accent bg-accent text-black shadow-[0_8px_24px_-12px_rgba(245,158,11,0.6)]"
                          : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-accent/40 hover:bg-white/[0.06] hover:text-white"
                      } ${
                        isProcessing ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${
                          isActive ? "text-black/60" : "text-zinc-500"
                        }`}
                      >
                        {isActive ? "Selected" : "Show"}
                      </span>
                      <span className="mt-0.5 text-sm font-bold">
                        {option.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <section className="rounded-3xl border border-white/[0.06] bg-surface/80 p-3 shadow-[0_35px_90px_-60px_rgba(0,0,0,0.95)] backdrop-blur-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 sm:px-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-px w-5 bg-accent" />
                  <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                    Choose seats
                  </h2>
                </div>
                <p className="mt-1.5 text-[11px] text-zinc-500 sm:text-xs">
                  Tap a seat to add it. Choose up to {MAX_SEATS_PER_BOOKING}{" "}
                  seats.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-zinc-400">
                  {availableSeats} available
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                    selectedList.length > 0
                      ? "border-accent/25 bg-accent/10 text-accent"
                      : "border-white/[0.08] bg-white/[0.03] text-zinc-500"
                  }`}
                >
                  {selectedList.length}/{MAX_SEATS_PER_BOOKING} selected
                </span>
              </div>
            </div>

            <div className="mt-4 sm:mt-5">
              <SeatMap
                basePrice={price}
                bookedSeats={bookedSeatSet}
                selectedSeats={selectedSeats}
                isProcessing={isProcessing}
                isLocked={isLocked}
                onToggleSeat={toggleSeat}
              />
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="hidden lg:block">
              <HallMiniMap
                basePrice={price}
                bookedSeats={bookedSeatSet}
                selectedSeats={selectedSeats}
                activeSeat={latestSelectedSeat}
              />
            </div>

            <section className="rounded-3xl border border-white/[0.06] bg-surface/80 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                  Your selection
                </p>
                <span className="text-[10px] text-zinc-500">
                  {selectedList.length}{" "}
                  {selectedList.length === 1 ? "seat" : "seats"}
                </span>
              </div>

              {selectedList.length === 0 ? (
                <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                    <Armchair className="h-4 w-4" />
                  </span>
                  <p className="mt-2 text-xs font-semibold text-white">
                    No seats selected yet
                  </p>
                  <p className="mt-1 max-w-[220px] text-[10px] leading-relaxed text-zinc-500">
                    Pick your favourites from the map. Gold-dotted seats offer
                    the best view.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedList.map((seat) => (
                      <button
                        key={seat}
                        type="button"
                        onClick={() => toggleSeat(seat)}
                        disabled={isProcessing}
                        aria-label={`Remove seat ${seat}`}
                        title={`Remove seat ${seat}`}
                        className="group inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:border-accent/50 hover:bg-accent/15 disabled:cursor-wait"
                      >
                        {seat}
                        <X className="h-2.5 w-2.5 opacity-50 transition-opacity group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-3">
                    {categoryBreakdown.map((entry) => (
                      <div
                        key={entry.category.id}
                        className="flex items-center justify-between gap-3 text-[11px]"
                      >
                        <span className="text-zinc-400">
                          {entry.category.name} Ã— {entry.count}
                        </span>
                        <span className="font-medium text-zinc-200">
                          {formatPrice(entry.subtotal)}
                        </span>
                      </div>
                    ))}

                    <div className="mt-1 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-2.5">
                      <span className="text-xs font-semibold text-white">
                        Total
                      </span>
                      <span className="text-lg font-bold text-accent">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (latestSelectedSeat) {
                        setPreviewSeat(latestSelectedSeat);
                      }
                    }}
                    disabled={!latestSelectedSeat || isProcessing}
                    className="mt-3 flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2.5 text-[11px] font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View from seat
                    {latestSelectedSeat && (
                      <span className="rounded-full border border-accent/30 bg-black/20 px-1.5 py-0.5 text-[10px]">
                        {latestSelectedSeat}
                      </span>
                    )}
                  </button>

                  {!isLoggedIn && (
                    <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
                      You will be asked to sign in before payment.
                    </p>
                  )}
                </>
              )}
            </section>
          </aside>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="fixed bottom-24 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-2.5 rounded-xl border border-red-500/30 bg-[#1a1111] px-4 py-3 text-left text-xs font-medium text-red-200 shadow-2xl shadow-black/50"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="flex-1 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="mt-0.5 text-red-300/70 transition-colors hover:text-red-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-background/95 backdrop-blur-xl">
        <div className="h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 lg:px-8">
          <span
            className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl border px-2 text-sm font-bold ${
              selectedList.length > 0
                ? "border-accent/25 bg-accent/10 text-accent"
                : "border-white/[0.08] bg-white/[0.03] text-zinc-500"
            }`}
          >
            {selectedList.length}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-zinc-400">
              {selectedList.length}{" "}
              {selectedList.length === 1 ? "seat" : "seats"} selected
            </p>
            <p className="mt-0.5 text-base font-bold text-white">
              {formatPrice(totalAmount)}
            </p>
            <p
              className="mt-0.5 truncate text-[10px] text-zinc-500"
              aria-live="polite"
            >
              {status ??
                (selectedList.length > 0
                  ? selectedList.join(", ")
                  : "No seats selected")}
            </p>
          </div>

          <button
            type="button"
            onClick={handleProceed}
            disabled={
              selectedList.length === 0 || isProcessing || isLocked
            }
            aria-busy={isProcessing}
            className="flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 text-xs font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-45 sm:px-5 sm:text-sm"
          >
            {isLocked ? (
              <>
                <LockKeyhole className="h-4 w-4" />
                Bookings closed
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Ticket className="h-4 w-4" />
                Pay {formatPrice(totalAmount)}
              </>
            )}
          </button>
        </div>
      </div>

      {previewSeat && (
        <SeatViewPreview
          seat={previewSeat}
          movieTitle={movieTitle}
          posterUrl={moviePosterUrl}
          trailerUrl={trailerUrl}
          onClose={() => setPreviewSeat(null)}
        />
      )}
    </>
  );
}

