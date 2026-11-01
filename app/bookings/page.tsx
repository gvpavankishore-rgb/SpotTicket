import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Ticket,
} from "lucide-react";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import EmptyState from "@/components/EmptyState";
import { getBookingsForUser } from "@/lib/bookings";
import { formatPrice, formatShowDate, formatShowTime } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Bookings | SpotTicket",
};

export default async function BookingsPage() {
  if (!isSupabaseConfigured) {
    redirect("/login");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: bookings, error } = await getBookingsForUser(user.id);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-5 bg-accent" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Your tickets
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            My bookings
          </h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-400">
            All the seats you have booked with SpotTicket, in one place.
          </p>
        </div>

        {bookings.length > 0 && (
          <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-zinc-400">
            {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
          </span>
        )}
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">We could not load your bookings.</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
              {error}
            </p>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Ticket}
            title="No bookings yet"
            description="Your movie tickets will show up here once you book your first show."
            action={
              <Link
                href="/movies"
                className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
              >
                Explore movies
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {bookings.map((booking) => {
            const show = booking.shows;
            const movieTitle = show?.movies?.title ?? "Movie";
            const theatreName = show?.theatres?.name ?? "SpotTicket";
            const theatreLocation = show?.theatres?.location ?? "";

            return (
              <article
                key={booking.id}
                className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface transition-colors hover:border-accent/25"
              >
                <div className="grid sm:grid-cols-[minmax(0,1fr)_180px]">
                  <div className="min-w-0 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                        <Ticket className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-bold leading-snug text-white sm:text-base">
                            {movieTitle}
                          </h2>
                          <BookingStatusBadge status={booking.status} />
                        </div>

                        <p className="mt-1 flex items-start gap-1.5 text-xs text-zinc-400">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                          <span>
                            {theatreName}
                            {theatreLocation ? `, ${theatreLocation}` : ""}
                          </span>
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-400">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-zinc-500" />
                            {formatShowDate(show?.show_date ?? "")}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-zinc-500" />
                            {formatShowTime(show?.show_time ?? "")}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Seats
                          </span>
                          {booking.seats.map((seat) => (
                            <span
                              key={seat}
                              className="rounded border border-accent/25 bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent"
                            >
                              {seat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex flex-col justify-between gap-3 border-t border-dashed border-white/10 bg-black/10 p-4 sm:border-l sm:border-t-0 sm:p-5">
                    <span
                      aria-hidden="true"
                      className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-background sm:hidden"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute -left-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-background sm:block"
                    />

                    <div className="flex items-center justify-between gap-3 sm:block">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                          Total paid
                        </p>
                        <p className="mt-0.5 text-base font-bold text-white">
                          {formatPrice(booking.total_amount)}
                        </p>
                      </div>

                      <Link
                        href={`/booking/success?id=${encodeURIComponent(
                          booking.id,
                        )}`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-[11px] font-semibold text-accent transition-colors hover:border-accent/50 hover:bg-accent/15 sm:w-full sm:justify-center"
                      >
                        View ticket
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <p className="hidden text-[10px] leading-relaxed text-zinc-500 sm:block">
                      Keep this payment ID handy for support.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1 border-t border-white/[0.06] bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Payment ID
                  </span>
                  <span className="break-all font-mono text-[11px] text-zinc-400">
                    {booking.payment_id || "—"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
