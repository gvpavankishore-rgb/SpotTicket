"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import SnackSelector from "@/components/SnackSelector";
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
import {
  MAX_SNACK_QUANTITY,
  priceSnackSelections,
  type Snack,
  type SnackSelection,
} from "@/lib/snacks";
import { getSeatHoldStorageKey, type StoredSeatHold } from "@/lib/seat-hold";
import { isShowBookingClosed } from "@/lib/show-time";
import SeatHoldTimer from "@/components/SeatHoldTimer";


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
  is3D?: boolean;
  glassCharge?: number;
  userEmail: string | null;
  userPhone: string | null;
  bookedSeats?: string[];
  snacks?: Snack[];
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
  is3D = false,
  glassCharge = 0,
  userEmail,
  userPhone,
  bookedSeats = [],
  snacks = [],
}: SeatSelectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [snackQuantities, setSnackQuantities] = useState<Record<string, number>>(
    {},
  );
  const [hold, setHold] = useState<StoredSeatHold | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSeat, setPreviewSeat] = useState<string | null>(null);
  const [showClosedNow, setShowClosedNow] = useState(bookingClosed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setShowClosedNow(bookingClosed);
  }, [bookingClosed]);

  useEffect(() => {
    if (searchParams.get("expired") === "1") {
      setError("Session expired, please select seats again.");
    }
  }, [searchParams]);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(getSeatHoldStorageKey(showId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<StoredSeatHold>;
        if (
          parsed &&
          parsed.showId === showId &&
          Array.isArray(parsed.seats) &&
          typeof parsed.expiresAt === "string"
        ) {
          const expiresAt = new Date(parsed.expiresAt).getTime();
          if (Number.isFinite(expiresAt) && expiresAt > Date.now()) {
            setHold({
              holdId: typeof parsed.holdId === "string" ? parsed.holdId : "",
              showId,
              seats: parsed.seats.filter((s): s is string => typeof s === "string"),
              snacks: Array.isArray(parsed.snacks)
                ? parsed.snacks.filter(
                    (s): s is { id: string; quantity: number } =>
                      Boolean(s) &&
                      typeof (s as { id?: unknown }).id === "string" &&
                      typeof (s as { quantity?: unknown }).quantity === "number",
                  )
                : [],
              expiresAt: parsed.expiresAt,
            });
            setSelectedSeats(new Set(parsed.seats.filter((s): s is string => typeof s === "string")));
            const q: Record<string, number> = {};
            for (const s of Array.isArray(parsed.snacks) ? parsed.snacks : []) {
              if (s && typeof (s as { id?: unknown }).id === "string" && typeof (s as { quantity?: unknown }).quantity === "number") {
                q[(s as { id: string }).id] = (s as { quantity: number }).quantity;
              }
            }
            setSnackQuantities(q);
          } else {
            window.sessionStorage.removeItem(getSeatHoldStorageKey(showId));
          }
        }
      } catch {
        // ignore
      }
    }
    setHydrated(true);
  }, [showId]);

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
  const snackSelections = useMemo<SnackSelection[]>(
    () =>
      snacks.flatMap((snack) => {
        const quantity = snackQuantities[snack.id] ?? 0;

        return quantity > 0 ? [{ id: snack.id, quantity }] : [];
      }),
    [snacks, snackQuantities],
  );
  const snackPricing = useMemo(
    () => priceSnackSelections(snackSelections, snacks),
    [snackSelections, snacks],
  );
  const snackTotal = snackPricing?.total ?? 0;
  const snackCount = snackSelections.reduce(
    (sum, selection) => sum + selection.quantity,
    0,
  );
  const seatTotal = useMemo(
    () => calculateSeatTotal(price, selectedList),
    [price, selectedList],
  );
  const glassUnit = is3D ? Math.max(0, glassCharge) : 0;
  const glassTotal = glassUnit * selectedList.length;
  const totalAmount = seatTotal + glassTotal + snackTotal;

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
    if (!hydrated || typeof window === "undefined") return;
    if (isLocked) return;
    if (selectedList.length === 0) {
      window.sessionStorage.removeItem(getSeatHoldStorageKey(showId));
      return;
    }
    const existingRaw = window.sessionStorage.getItem(getSeatHoldStorageKey(showId));
    let existing: StoredSeatHold | null = null;
    if (existingRaw) {
      try { existing = JSON.parse(existingRaw) as StoredSeatHold; } catch { existing = null; }
    }
    const next: StoredSeatHold = {
      holdId: existing?.showId === showId && existing.holdId ? existing.holdId : (hold?.holdId ?? ""),
      showId,
      seats: selectedList,
      snacks: snackSelections,
      expiresAt:
        existing?.showId === showId &&
        existing.expiresAt &&
        new Date(existing.expiresAt).getTime() > Date.now()
          ? existing.expiresAt
          : (hold?.expiresAt ?? ""),
    };
    window.sessionStorage.setItem(getSeatHoldStorageKey(showId), JSON.stringify(next));
  }, [hydrated, isLocked, selectedList, snackSelections, showId, hold?.holdId, hold?.expiresAt]);

  const handleHoldExpire = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(getSeatHoldStorageKey(showId));
    }
    setHold(null);
    router.push(`/book/${showId}?expired=1`);
    router.refresh();
  }, [router, showId]);

  useEffect(() => {
    if (previewSeat && !selectedSeats.has(previewSeat)) {
      setPreviewSeat(null);
    }
  }, [previewSeat, selectedSeats]);

  useEffect(() => {
    const availableIds = new Set(snacks.map((snack) => snack.id));

    setSnackQuantities((current) => {
      const next: Record<string, number> = {};

      for (const [id, quantity] of Object.entries(current)) {
        if (availableIds.has(id)) {
          next[id] = quantity;
        }
      }

      return Object.keys(next).length === Object.keys(current).length
        ? current
        : next;
    });
  }, [snacks]);


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

  function updateSnackQuantity(snackId: string, quantity: number) {
    setError(null);
    setSnackQuantities((current) => {
      const nextQuantity = Math.max(
        0,
        Math.min(MAX_SNACK_QUANTITY, quantity),
      );

      if ((current[snackId] ?? 0) === nextQuantity) {
        return current;
      }

      const next = { ...current };

      if (nextQuantity === 0) {
        delete next[snackId];
      } else {
        next[snackId] = nextQuantity;
      }

      return next;
    });
  }

  function skipSnacks() {
    setError(null);
    setSnackQuantities({});
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
    setStatus("Holding your seats...");

    try {
      const holdResponse = await fetch("/api/seat-holds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId, seats: selectedList }),
      });
      const holdPayload = await readJson<{ holdId?: string; expiresAt?: string } & ApiError>(holdResponse);

      if (holdResponse.status === 401) {
        setIsProcessing(false);
        setStatus(null);
        router.push(loginHref);
        return;
      }
      if (!holdResponse.ok || !holdPayload?.holdId || !holdPayload?.expiresAt) {
        if (holdResponse.status === 409) router.refresh();
        throw new Error(holdPayload?.error ?? "Could not hold seats. Please try again.");
      }

      const nextHold: StoredSeatHold = {
        holdId: holdPayload.holdId,
        showId,
        seats: selectedList,
        snacks: snackSelections,
        expiresAt: holdPayload.expiresAt,
      };
      setHold(nextHold);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(getSeatHoldStorageKey(showId), JSON.stringify(nextHold));
      }

      router.push(`/book/${showId}/bill`);
      router.refresh();
    } catch (e) {
      setError(getErrorMessage(e, "Could not proceed to bill. Please try again."));
    } finally {
      setIsProcessing(false);
      setStatus(null);
    }
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-5">
        {hold?.expiresAt && !isLocked && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-accent/[0.06] p-3 sm:p-4">
            <div>
              <p className="text-sm font-semibold text-white">Seats on hold</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">Complete payment before the timer ends.</p>
            </div>
            <SeatHoldTimer expiresAt={hold.expiresAt} onExpire={handleHoldExpire} />
          </div>
        )}
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="h-px w-5 bg-accent" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                    Select your seats
                  </span>
                  {is3D && (
                    <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-black shadow-[0_0_18px_rgba(245,158,11,0.35)]">
                      3D
                    </span>
                  )}
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
                {is3D && (
                  <p className="mt-2 inline-flex rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[10px] font-medium text-accent">
                    3D Glasses will be provided / charged at booking
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
          <div className="space-y-4">
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
                is3D={is3D}
                onToggleSeat={toggleSeat}
              />
            </div>
            </section>

            <SnackSelector
              snacks={snacks}
              quantities={snackQuantities}
              disabled={isProcessing || isLocked}
              onQuantityChange={updateSnackQuantity}
              onSkip={skipSnacks}
            />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">

            <div className="hidden lg:block">
              <HallMiniMap
                basePrice={price}
                bookedSeats={bookedSeatSet}
                selectedSeats={selectedSeats}
                activeSeat={latestSelectedSeat}
                is3D={is3D}
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
                          {entry.category.name} · {entry.count}
                        </span>
                        <span className="font-medium text-zinc-200">
                          {formatPrice(entry.subtotal)}
                        </span>
                      </div>
                    ))}

                    {glassTotal > 0 && (
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="text-zinc-400">
                          3D Glasses · {selectedList.length}
                        </span>
                        <span className="font-medium text-zinc-200">
                          {formatPrice(glassTotal)}
                        </span>
                      </div>
                    )}

                    {snackTotal > 0 && (
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="text-zinc-400">Snacks</span>
                        <span className="font-medium text-zinc-200">
                          {formatPrice(snackTotal)}
                        </span>
                      </div>
                    )}

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
                  ? [
                      selectedList.join(", "),
                      glassTotal > 0
                        ? `3D glasses ${formatPrice(glassTotal)}`
                        : null,
                      snackCount > 0
                        ? `${snackCount} snack${snackCount === 1 ? "" : "s"}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
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
            className="cta-primary flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 text-xs font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-45 sm:px-5 sm:text-sm"
          >
            {isLocked ? (
              <>
                <LockKeyhole className="h-4 w-4" />
                Bookings closed
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {status ?? "Processing..."}
              </>
            ) : (
              <>
                <Ticket className="h-4 w-4" />
                Proceed to Bill
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
          is3D={is3D}
          onClose={() => setPreviewSeat(null)}
        />
      )}
    </>
  );
}

