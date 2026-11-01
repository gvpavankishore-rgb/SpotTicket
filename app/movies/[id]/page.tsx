import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  Film,
  Languages,
  Tag,
  Ticket,
} from "lucide-react";
import CatalogError from "@/components/CatalogError";
import MovieShowtimes from "@/components/MovieShowtimes";
import {
  getMovieById,
  getUpcomingShowsForMovie,
} from "@/lib/catalog";
import { getTodayDateKey } from "@/lib/format";
import { getLocationContext } from "@/lib/locations";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Movie Details | SpotTicket",
};

interface MovieDetailPageProps {
  params: {
    id: string;
  };
}

export default async function MovieDetailPage({
  params,
}: MovieDetailPageProps) {
  const { data: movie, error } = await getMovieById(params.id);

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

  if (!movie) {
    notFound();
  }

  const { selected } = await getLocationContext();
  const { data: shows, error: showsError } =
    await getUpcomingShowsForMovie(movie.id, selected?.id);
  const todayKey = getTodayDateKey();
  const nowMs = Date.now();

  return (
    <div>
      <Link
        href="/movies"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All movies
      </Link>

      <section className="relative mt-4 overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#1c1709] via-[#12100b] to-[#0b0b0b] p-5 sm:p-6 lg:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
        />

        <div className="relative grid gap-6 md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          <div className="relative mx-auto aspect-[2/3] w-full max-w-[220px] overflow-hidden rounded-2xl border border-white/[0.08] bg-surface shadow-2xl shadow-black/50 md:mx-0 md:max-w-none">
            {movie.poster_url ? (
              <Image
                src={movie.poster_url}
                alt={`${movie.title} poster`}
                fill
                sizes="(max-width: 768px) 220px, 240px"
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1c1709] via-[#141414] to-[#0b0b0b]">
                <Film className="h-12 w-12 text-accent/50" strokeWidth={1.25} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
              <Ticket className="h-3.5 w-3.5" />
              Now Showing
            </span>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              {movie.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300">
                <Languages className="h-3.5 w-3.5 text-accent" />
                {movie.language}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300">
                <Tag className="h-3.5 w-3.5 text-accent" />
                {movie.genre}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300">
                <Clock className="h-3.5 w-3.5 text-accent" />
                {movie.duration}
              </span>
            </div>

            <p className="mt-5 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-zinc-300 sm:text-base">
              {movie.description?.trim() ||
                "More details about this movie are coming soon."}
            </p>

            <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500">
              <CalendarClock className="h-4 w-4 text-accent" />
              {showsError
                ? "Showtimes are unavailable right now."
                : `${shows.length} ${
                    shows.length === 1 ? "show" : "shows"
                  } available`}
            </div>
          </div>
        </div>
      </section>

      {showsError ? (
        <section className="mt-8">
          <CatalogError message={showsError} />
        </section>
      ) : (
        <MovieShowtimes
          shows={shows}
          todayKey={todayKey}
          nowMs={nowMs}
          locationName={selected?.name ?? null}
        />
      )}
    </div>
  );
}
