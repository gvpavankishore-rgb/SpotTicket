"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, CalendarDays, Clock, CreditCard, Loader2, MapPin, Receipt, Ticket, X } from "lucide-react";
import SeatHoldTimer from "@/components/SeatHoldTimer";
import { formatPrice, getErrorMessage } from "@/lib/format";
import { calculateBookingCharges, roundMoney } from "@/lib/pricing";
import { getSeatHoldStorageKey, type StoredSeatHold } from "@/lib/seat-hold";
import { calculateSeatTotal } from "@/lib/seats";
import type { Snack } from "@/lib/snacks";
import { createClient } from "@/lib/supabase/client";

const RAZORPAY_SCRIPT_ID = "razorpay-checkout-js";

interface BillCheckoutProps {
  showId: string;
  movieTitle: string;
  theatreName: string;
  theatreLocation: string;
  showDateLabel: string;
  showTimeLabel: string;
  basePrice: number;
  is3D: boolean;
  glassCharge: number;
  hold: { holdId: string; seats: string[]; expiresAt: string } | null;
  userEmail: string | null;
  userPhone: string | null;
}

interface OrderResponse { orderId: string; amount: number; currency: string; keyId: string; description: string; }
interface ApiError { error?: string; code?: string }

function loadRazorpayCheckout() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const existing = document.getElementById(RAZORPAY_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
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

async function readJson<T>(response: Response) { try { return (await response.json()) as T; } catch { return null; } }

export default function BillCheckout(props: BillCheckoutProps) {
  const router = useRouter();
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [stored, setStored] = useState<StoredSeatHold | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const hold = useMemo(() => {
    if (props.hold) return props.hold;
    if (stored && stored.holdId && new Date(stored.expiresAt).getTime() > Date.now()) {
      return { holdId: stored.holdId, seats: stored.seats, expiresAt: stored.expiresAt };
    }
    return null;
  }, [props.hold, stored]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(getSeatHoldStorageKey(props.showId));
    if (raw) {
      try { setStored(JSON.parse(raw) as StoredSeatHold); } catch { /* ignore */ }
    }
  }, [props.showId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("snacks").select("id,name,price,image_url,is_active").eq("is_active", true);
        if (mounted) setSnacks((data ?? []).map((r) => ({ id: String(r.id), name: String(r.name ?? ""), price: Number(r.price), image_url: typeof r.image_url === "string" ? r.image_url : null, is_active: r.is_active !== false })));
      } catch { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  const selectedSeats = useMemo(() => {
    const fromHold = hold?.seats?.length ? hold.seats : [];
    const fromStore = stored?.seats?.length ? stored.seats : [];
    return (fromHold.length ? fromHold : fromStore).map((s) => s.toUpperCase());
  }, [hold, stored]);

  const snackLines = useMemo(() => {
    const sel = stored?.snacks ?? [];
    const byId = new Map(snacks.map((s) => [s.id, s]));
    return sel.flatMap((s) => {
      const sn = byId.get(s.id);
      if (!sn || s.quantity <= 0) return [];
      return [{ ...sn, quantity: s.quantity, lineTotal: roundMoney(sn.price * s.quantity) }];
    });
  }, [stored, snacks]);

  const seatTotal = useMemo(() => calculateSeatTotal(props.basePrice, selectedSeats), [props.basePrice, selectedSeats]);
  const glassTotal = props.is3D ? Math.max(0, props.glassCharge) * selectedSeats.length : 0;
  const snacksTotal = roundMoney(snackLines.reduce((sum, s) => sum + s.lineTotal, 0));
  const charges = calculateBookingCharges();
  const grandTotal = roundMoney(seatTotal + glassTotal + snacksTotal + charges.total);

  const onExpire = useCallback(() => {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(getSeatHoldStorageKey(props.showId));
    router.push(`/book/${props.showId}?expired=1`);
    router.refresh();
  }, [router, props.showId]);

  async function handlePay() {
    if (isProcessing || !hold?.holdId || selectedSeats.length === 0) return;
    if (new Date(hold.expiresAt).getTime() <= Date.now()) { onExpire(); return; }
    setError(null); setIsProcessing(true); setStatus("Creating your order...");
    try {
      const orderResponse = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId: props.showId, seats: selectedSeats, snacks: stored?.snacks ?? [], holdId: hold.holdId }),
      });
      const orderPayload = await readJson<OrderResponse & ApiError>(orderResponse);
      if (!orderResponse.ok || !orderPayload?.orderId) {
        if (orderPayload?.code === "HOLD_EXPIRED" || orderResponse.status === 409) { onExpire(); return; }
        throw new Error(orderPayload?.error ?? "Could not start payment.");
      }
      setStatus("Loading Razorpay Checkout...");
      if (!(await loadRazorpayCheckout())) throw new Error("Could not load Razorpay Checkout.");
      setStatus("Waiting for payment...");
      let finished = false;
      const checkout = new window.Razorpay({
        key: orderPayload.keyId, amount: orderPayload.amount, currency: orderPayload.currency,
        name: "SpotTicket", description: orderPayload.description, order_id: orderPayload.orderId,
        prefill: { ...(props.userEmail ? { email: props.userEmail } : {}), ...(props.userPhone ? { contact: props.userPhone } : {}) },
        theme: { color: "#f59e0b" },
        modal: { ondismiss: () => { if (!finished) { setIsProcessing(false); setStatus(null); setError("Payment was cancelled. Your seats are still held."); } } },
        handler: async (response) => {
          finished = true; setStatus("Confirming your booking...");
          try {
            const bookingResponse = await fetch("/api/bookings", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, showId: props.showId, seats: selectedSeats, snacks: stored?.snacks ?? [], holdId: hold.holdId }),
            });
            const bookingPayload = await readJson<{ bookingId?: string } & ApiError>(bookingResponse);
            if (!bookingResponse.ok || !bookingPayload?.bookingId) {
              if (bookingPayload?.code === "HOLD_EXPIRED") { onExpire(); return; }
              throw new Error(bookingPayload?.error ?? "Payment received but booking could not be saved. Contact support.");
            }
            if (typeof window !== "undefined") window.sessionStorage.removeItem(getSeatHoldStorageKey(props.showId));
            router.push(`/booking/success?id=${encodeURIComponent(bookingPayload.bookingId)}`);
          } catch (e) { setIsProcessing(false); setStatus(null); setError(getErrorMessage(e, "Payment received but booking could not be saved. Contact support.")); }
        },
      });
      checkout.on("payment.failed", (f) => { finished = true; setIsProcessing(false); setStatus(null); setError(f.error?.description ?? "Payment failed."); });
      checkout.open();
    } catch (e) { setIsProcessing(false); setStatus(null); setError(getErrorMessage(e, "Could not start payment.")); }
  }

  if (!hold) {
    return (
      <div className="rounded-3xl border border-rose-400/20 bg-rose-500/[0.08] p-6 text-center">
        <p className="text-sm font-semibold text-rose-100">No active seat hold found.</p>
        <p className="mt-1 text-xs text-rose-100/70">Your session may have expired. Please select seats again.</p>
        <button onClick={onExpire} className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black">Select seats</button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <section className="rounded-3xl border border-white/[0.08] bg-surface/80 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><span className="h-px w-5 bg-accent" /><span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Bill summary</span></div>
            <h1 className="mt-2 text-xl font-bold text-white sm:text-2xl">{props.movieTitle}</h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-accent" />{props.theatreName}{props.theatreLocation ? `, ${props.theatreLocation}` : ""}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-accent" />{props.showDateLabel}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-accent" />{props.showTimeLabel}</span>
            </div>
          </div>
          <SeatHoldTimer expiresAt={hold.expiresAt} onExpire={onExpire} />
        </div>

        <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Selected seats</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedSeats.map((s) => <span key={s} className="rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent">{s}</span>)}
          </div>
        </div>

        {snackLines.length > 0 && (
          <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Snacks</p>
            <div className="mt-2 space-y-2">
              {snackLines.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs"><span className="text-zinc-300">{s.name} <span className="text-zinc-500">× {s.quantity}</span></span><span className="text-white">{formatPrice(s.lineTotal)}</span></div>
              ))}
            </div>
          </div>
        )}
      </section>

      <aside className="rounded-3xl border border-white/[0.08] bg-surface/80 p-5 sm:p-6 lg:sticky lg:top-24">
        <div className="flex items-center gap-2"><Receipt className="h-4 w-4 text-accent" /><h2 className="text-sm font-semibold text-white">Invoice</h2></div>
        <div className="mt-4 space-y-2.5 text-xs">
          <Row label={`Tickets (${selectedSeats.length})`} value={formatPrice(seatTotal)} />
          {glassTotal > 0 && <Row label={`3D Glass charges (${selectedSeats.length})`} value={formatPrice(glassTotal)} />}
          {snacksTotal > 0 && <Row label="Snacks amount" value={formatPrice(snacksTotal)} />}
          <Row label="Booking Charges" value={formatPrice(charges.bookingCharge)} />
          <Row label="IGST (18% on Booking Charges)" value={formatPrice(charges.igst)} />
          <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-sm font-bold text-white"><span>Grand Total</span><span className="text-accent">{formatPrice(grandTotal)}</span></div>
        </div>

        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[11px] text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p className="flex-1">{error}</p>
            <button onClick={() => setError(null)} aria-label="Dismiss"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        <button type="button" onClick={handlePay} disabled={isProcessing || selectedSeats.length === 0} aria-busy={isProcessing}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50">
          {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin" />{status ?? "Processing..."}</> : <><CreditCard className="h-4 w-4" />Pay Now {formatPrice(grandTotal)}</>}
        </button>
        <p className="mt-2 text-center text-[10px] text-zinc-500">Seats are held until the timer expires.</p>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-zinc-400">{label}</span><span className="font-medium text-zinc-200">{value}</span></div>;
}
