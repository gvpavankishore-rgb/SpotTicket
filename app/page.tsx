import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import CatalogError from "@/components/CatalogError";
import EmptyState from "@/components/EmptyState";
import MovieCard from "@/components/MovieCard";
import ComingSoonSection from "@/components/home/ComingSoonSection";
import HomeFooter from "@/components/home/HomeFooter";
import HomeHero from "@/components/home/HomeHero";
import PopularMovies from "@/components/home/PopularMovies";
import SectionHeading from "@/components/home/SectionHeading";
import { getComingSoonMovies, getMovies } from "@/lib/catalog";
import { getLocationContext } from "@/lib/locations";
import { sortMoviesByScore } from "@/lib/movie-score";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { selected } = await getLocationContext();
  const [{ data: movies, error }, comingSoonResult] = await Promise.all([
    getMovies(selected?.id),
    getComingSoonMovies(selected?.id),
  ]);

  const locationName = selected?.name;
  const rankedMovies = sortMoviesByScore(movies);
  const featuredMovie = rankedMovies[0] ?? null;
  const popularMovies = rankedMovies.slice(0, 5);
  const comingSoonMovies = comingSoonResult.data.slice(0, 6);

  return (
    <div>
      <HomeHero
        locationName={locationName}
        featuredMovie={featuredMovie}
        movieCount={movies.length}
      />

      <section id="now-showing" className="scroll-mt-24 pt-12 sm:pt-16">
        <SectionHeading
          index="01"
          eyebrow="Now Showing"
          title={
            locationName
              ? `Playing in ${locationName}`
              : "On the big screen right now"
          }
          description="Fresh releases, handpicked for a night out. Pick a film, choose your seat, and leave the rest to us."
          action={
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-medium text-zinc-400 min-[420px]:inline-flex">
                {movies.length} {movies.length === 1 ? "movie" : "movies"}
              </span>
              <Link
                href="/movies"
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-accent/30 hover:text-accent"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          }
        />

        {error ? (
          <div className="mt-6">
            <CatalogError message={error} />
          </div>
        ) : movies.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title={
                locationName
                  ? `No movies showing in ${locationName} yet`
                  : "No movies showing yet"
              }
              description={
                locationName
                  ? "Try another location from the header, or check back soon for new releases."
                  : "New releases will appear here as soon as they are added. Check back soon."
              }
              action={
                <Link
                  href="/movies"
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-accent/30 hover:text-accent"
                >
                  Browse movies
                </Link>
              }
            />
          </div>
        ) : (
          <div
            aria-label="Now showing movies"
            className="no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scroll-px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:snap-none sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          >
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="w-[46vw] max-w-[190px] flex-none snap-start sm:w-auto sm:max-w-none"
              >
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </section>

      <PopularMovies movies={popularMovies} />

      <ComingSoonSection
        index={popularMovies.length > 0 ? "03" : "02"}
        movies={comingSoonMovies}
        locationName={locationName}
      />

      <HomeFooter locationName={locationName} />

      <Link
        href="#now-showing"
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-accent px-4 py-3 text-xs font-bold text-black shadow-[0_16px_45px_-10px_rgba(245,158,11,0.7)] transition-transform active:scale-95 sm:hidden"
      >
        <Ticket className="h-4 w-4" strokeWidth={2.5} />
        Book Tickets
      </Link>
    </div>
  );
}
