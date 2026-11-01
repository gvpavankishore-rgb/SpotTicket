import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Film,
  Home,
  MapPin,
  Ticket,
} from "lucide-react";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import { getBookingById } from "@/lib/bookings";
import { formatPrice, formatShowDate, formatShowTime } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Booking Confirmed | SpotTicket",
};

interface BookingSuccessPageProps {
  searchParams: {
    id?: string | string[];
  };
}

function BookingState({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10">
        <Ticket className="h-8 w-8 text-accent" strokeWidth={1.75} />
      </span>
      <h1 className="mt-5 text-xl font-bold text-white sm:text-2xl">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
        >
          My bookings
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-accent/40 hover:text-accent"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default async function BookingSuccessPage({
  searchParams,
}: BookingSuccessPageProps) {
  const requestedId = Array.isArray(searchParams.id)
    ? searchParams.id[0]
    : searchParams.id;
  const nextPath = requestedId
    ? `/booking/success?id=${encodeURIComponent(requestedId)}`
    : "/booking/success";

  if (!isSupabaseConfigured) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!requestedId) {
    return (
      <BookingState
        title="No booking selected"
        message="Open the confirmation link for a booking to view its ticket."
      />
    );
  }

  const { data: booking, error } = await getBookingById(requestedId, user.id);

  if (error) {
    return <BookingState title="Could not load this booking" message={error} />;
  }

  if (!booking) {
    return (
      <BookingState
        title="Booking not found"
        message="This booking does not exist or does not belong to your account."
      />
    );
  }

  const show = booking.shows;
  const movieTitle = show?.movies?.title ?? "Movie";
  const posterUrl = show?.movies?.poster_url ?? "";
  const theatreName = show?.theatres?.name ?? "SpotTicket";
  const theatreLocation = show?.theatres?.location ?? "";
  const seatLabel = `${booking.seats.length} ${
    booking.seats.length === 1 ? "seat" : "seats"
  }`;

  return (
    <div className="relative mx-auto max-w-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-44 w-44 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 shadow-glow">
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} />
        </span>
        <div className="mt-4 flex items-center gap-2">
          <span className="h-px w-5 bg-accent" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Payment successful
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Your seats are booked
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
          Show this ticket at the theatre entrance. Your booking is saved to
          your account.
        </p>
      </div>

      <div className="relative mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-surface shadow-glow">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent"
        />

        <div className="p-5 pt-6 sm:p-6 sm:pt-7">
          <div className="flex items-start gap-4">
            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 sm:h-32 sm:w-24">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={`${movieTitle} poster`}
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1c1709] via-[#141414] to-[#0b0b0b]">
                  <Film className="h-8 w-8 text-accent/50" strokeWidth={1.5} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                SpotTicket · Movie ticket
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold leading-tight text-white sm:text-2xl">
                  {movieTitle}
                </h2>
                <BookingStatusBadge status={booking.status} />
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-zinc-400">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                <span>
                  {theatreName}
                  {theatreLocation ? `, ${theatreLocation}` : ""}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="relative border-y border-dashed border-white/10 bg-black/10 px-5 py-4 sm:px-6">
          <span
            aria-hidden="true"
            className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background"
          />
          <span
            aria-hidden="true"
            className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background"
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                <CalendarDays className="h-3 w-3" />
                Date
              </p>
              <p className="mt-1 text-xs font-semibold text-white">
                {formatShowDate(show?.show_date ?? "")}
              </p>
            </div>

            <div>
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                <Clock className="h-3 w-3" />
                Time
              </p>
              <p className="mt-1 text-xs font-semibold text-white">
                {formatShowTime(show?.show_time ?? "")}
              </p>
            </div>

            <div>
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                <Ticket className="h-3 w-3" />
                Seats
              </p>
              <p className="mt-1 text-xs font-semibold text-white">
                {seatLabel}
              </p>
            </div>

            <div>
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                <CreditCard className="h-3 w-3" />
                Paid
              </p>
              <p className="mt-1 text-xs font-semibold text-accent">
                {formatPrice(booking.total_amount)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              Your seats
            </p>
            <span className="text-[11px] text-zinc-500">{seatLabel}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {booking.seats.map((seat) => (
              <span
                key={seat}
                className="rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent"
              >
                {seat}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2 border-t border-white/[0.06] bg-black/20 p-5 text-[11px] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-zinc-500">Payment ID</span>
            <span className="break-all text-right font-mono font-medium text-zinc-300">
              {booking.payment_id}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-zinc-500">Booking ID</span>
            <span className="break-all text-right font-mono font-medium text-zinc-300">
              {booking.id}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          title="Ticket download will be available soon"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
        >
          <Download className="h-4 w-4" />
          Download Ticket
        </button>
        <Link
          href="/bookings"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:border-accent/40 hover:text-accent"
        >
          <Ticket className="h-4 w-4" />
          My Bookings
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:border-accent/40 hover:text-accent"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
