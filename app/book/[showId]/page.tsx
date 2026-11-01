import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import CatalogError from "@/components/CatalogError";
import SeatSelection from "@/components/SeatSelection";
import { getBookedSeatsForShow } from "@/lib/bookings";
import {
  getShowById,
  getShowtimesForMovieAtTheatreOnDate,
} from "@/lib/catalog";
import { formatShowDate, formatShowTime } from "@/lib/format";
import { getLocationContext } from "@/lib/locations";
import { getShowBookingStatus } from "@/lib/show-time";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Select Seats | SpotTicket",
};

interface BookShowPageProps {
  params: {
    showId: string;
  };
}

export default async function BookShowPage({ params }: BookShowPageProps) {
  const { selected } = await getLocationContext();
  const { data: show, error } = await getShowById(
    params.showId,
    selected?.id,
  );

  if (error) {
    return (
      <div>
        <Link
          href="/movies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All movies
        </Link>
        <div className="mt-4">
          <CatalogError message={error} />
        </div>
      </div>
    );
  }

  if (!show) {
    notFound();
  }

  const supabase = createClient();
  const [{ data: authData }, bookedSeatsResult, showtimesResult] =
    await Promise.all([
      supabase.auth.getUser(),
      getBookedSeatsForShow(params.showId),
      getShowtimesForMovieAtTheatreOnDate(
        show.movie_id,
        show.theatre_id,
        show.show_date,
      ),
    ]);
  const user = authData.user;
  const backHref = show.movies ? `/movies/${show.movies.id}` : "/movies";
  const theatreName = show.theatres?.name ?? "SpotTicket";
  const showDateLabel = formatShowDate(show.show_date);
  const showTimeLabel = formatShowTime(show.show_time);
  const showLabel = `${showDateLabel} · ${showTimeLabel}`;
  const movieMeta =
    [show.movies?.language, show.movies?.duration, show.movies?.genre]
      .filter(Boolean)
      .join(" · ") || null;
  const bookingStatus = getShowBookingStatus(show.show_date, show.show_time);
  const siblingShows: { id: string; show_time: string }[] =
    showtimesResult.data.length > 0 ? showtimesResult.data : [show];
  const showtimeOptions = siblingShows.map((option) => ({
    id: option.id,
    label: formatShowTime(option.show_time),
  }));

  return (
    <div className="pb-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to showtimes
      </Link>

      {bookedSeatsResult.error ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Could not load seat availability.</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
              {bookedSeatsResult.error} Refresh the page to try again.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <SeatSelection
            price={Number(show.price)}
            movieTitle={show.movies?.title ?? "this movie"}
            movieMeta={movieMeta}
            moviePosterUrl={show.movies?.poster_url ?? null}
            trailerUrl={show.movies?.trailer_url ?? null}
            showId={show.id}
            showDate={show.show_date}
            showTime={show.show_time}
            theatreName={theatreName}
            theatreLocation={show.theatres?.location ?? null}
            showDateLabel={showDateLabel}
            showTimeLabel={showTimeLabel}
            showLabel={showLabel}
            showtimeOptions={showtimeOptions}
            bookingClosed={bookingStatus.isClosed}
            isLoggedIn={Boolean(user)}
            userEmail={user?.email ?? null}
            userPhone={user?.phone ?? null}
            bookedSeats={bookedSeatsResult.data}
          />
        </div>
      )}
    </div>
  );
}
