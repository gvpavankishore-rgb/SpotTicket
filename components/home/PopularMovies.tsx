import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Film, Star } from "lucide-react";
import SectionHeading from "@/components/home/SectionHeading";
import type { CatalogMovie } from "@/lib/catalog";
import { formatMovieScore } from "@/lib/movie-score";

interface PopularMoviesProps {
  movies: CatalogMovie[];
}

export default function PopularMovies({ movies }: PopularMoviesProps) {
  if (movies.length === 0) {
    return null;
  }

  const [featured, ...rest] = movies;

  return (
    <section id="popular" className="mt-14 scroll-mt-24 sm:mt-20">
      <SectionHeading
        index="02"
        eyebrow="Popular now"
        title="The titles everyone is talking about"
        description="Our highest SpotScores this week — the films people are booking before the weekend rush."
        action={
          <Link
            href="/movies"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-accent/30 hover:text-accent"
          >
            All movies
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      />

      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-5">
        <Link
          href={`/movies/${featured.id}`}
          className="group relative min-h-[320px] overflow-hidden rounded-3xl border border-white/[0.08] bg-surface shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] outline-none transition-colors hover:border-accent/30 focus-visible:ring-2 focus-visible:ring-accent/70 sm:min-h-[380px]"
          aria-label={`View ${featured.title}`}
        >
          {featured.poster_url ? (
            <Image
              src={featured.poster_url}
              alt={`${featured.title} poster`}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              unoptimized
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1c1709] via-[#141414] to-[#0b0b0b]">
              <Film className="h-14 w-14 text-accent/40" strokeWidth={1.25} />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
          <div className="film-grain absolute inset-0 opacity-[0.04]" />

          <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full border border-accent/30 bg-black/55 px-2.5 py-1 text-[10px] font-bold text-accent backdrop-blur-md">
            <Star className="h-3 w-3 fill-current" />
            {formatMovieScore(featured)} SpotScore
          </span>

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
              #1 this week
            </p>
            <h3 className="mt-2 max-w-lg text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {featured.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-300">
              <span>{featured.language}</span>
              <span className="text-zinc-600">·</span>
              <span>{featured.genre}</span>
              <span className="text-zinc-600">·</span>
              <span>{featured.duration}</span>
            </div>
            {featured.description && (
              <p className="mt-3 line-clamp-2 max-w-xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
                {featured.description}
              </p>
            )}
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black transition-colors group-hover:bg-amber-400">
              View showtimes
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </div>
        </Link>

        {rest.length > 0 && (
          <div className="flex flex-col gap-3">
            {rest.map((movie, index) => (
              <Link
                key={movie.id}
                href={`/movies/${movie.id}`}
                className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2.5 outline-none transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/25 hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-accent/70 sm:gap-4 sm:p-3"
              >
                <span className="w-5 shrink-0 text-center text-sm font-black tabular-nums text-zinc-600 transition-colors group-hover:text-accent">
                  {String(index + 2).padStart(2, "0")}
                </span>

                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-surface sm:h-24 sm:w-16">
                  {movie.poster_url ? (
                    <Image
                      src={movie.poster_url}
                      alt=""
                      fill
                      sizes="64px"
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#141414]">
                      <Film className="h-4 w-4 text-accent/40" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-accent">
                    {movie.title}
                  </h3>
                  <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                    {movie.language} · {movie.genre} · {movie.duration}
                  </p>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-accent">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    {formatMovieScore(movie)}
                  </span>
                </div>

                <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-accent" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
