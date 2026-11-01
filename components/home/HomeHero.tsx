import Image from "next/image";
import Link from "next/link";
import {
  Armchair,
  ArrowRight,
  Film,
  ShieldCheck,
  Star,
  Ticket,
} from "lucide-react";
import CinemaNightIllustration from "@/components/home/CinemaNightIllustration";
import HeroSearch from "@/components/HeroSearch";
import type { CatalogMovie } from "@/lib/catalog";
import { formatMovieScore } from "@/lib/movie-score";

interface HomeHeroProps {
  locationName?: string | null;
  featuredMovie: CatalogMovie | null;
  movieCount: number;
}

export default function HomeHero({
  locationName,
  featuredMovie,
  movieCount,
}: HomeHeroProps) {
  return (
    <section className="relative left-1/2 -mt-5 w-screen -translate-x-1/2 overflow-hidden bg-[#050307] sm:-mt-8">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 top-[-12%] h-[34rem] w-[34rem] rounded-full bg-fuchsia-600/20 blur-[120px]" />
        <div className="absolute -right-28 bottom-[-14%] h-[36rem] w-[36rem] rounded-full bg-rose-600/15 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_62%_62%_at_76%_38%,rgba(236,72,153,0.17),transparent_66%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050307_0%,rgba(5,3,7,0.96)_36%,rgba(5,3,7,0.62)_66%,rgba(5,3,7,0.88)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,3,7,0.7)_0%,transparent_26%,transparent_66%,#0a0a0a_100%)]" />
        <div className="absolute inset-0 shadow-[inset_0_0_170px_55px_rgba(0,0,0,0.7)]" />
        <div className="film-grain absolute inset-0 opacity-[0.045]" />
      </div>

      <div className="relative mx-auto grid min-h-[600px] max-w-7xl items-center gap-6 px-4 py-12 sm:min-h-[660px] sm:gap-8 sm:px-6 sm:py-16 lg:min-h-[690px] lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-4 lg:px-8 lg:py-20">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex flex-wrap items-center gap-2 rounded-full border border-pink-300/20 bg-pink-500/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-100 backdrop-blur-md">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pink-400" />
            </span>
            {locationName
              ? `Now showing in ${locationName}`
              : "Now showing near you"}
            {movieCount > 0 && (
              <>
                <span className="text-pink-300/40">/</span>
                <span className="text-pink-300">
                  {movieCount} {movieCount === 1 ? "film" : "films"}
                </span>
              </>
            )}
          </span>

          <h1 className="mt-6 text-[clamp(2.35rem,12vw,2.75rem)] font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-6xl lg:text-[4.5rem]">
            <span className="block">Book Your</span>
            <span className="block bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-[0_12px_45px_rgba(236,72,153,0.28)]">
              Movie Tickets
            </span>
            <span className="block">with SpotTicket</span>
          </h1>

          <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-semibold text-zinc-300 sm:text-base">
            <span>Movies</span>
            <span className="h-1 w-1 rounded-full bg-pink-400/80" />
            <span>Cinemas</span>
            <span className="h-1 w-1 rounded-full bg-pink-400/80" />
            <span className="text-pink-200">Unforgettable Moments</span>
          </p>

          <div className="mt-7 max-w-xl">
            <HeroSearch placeholder="Search for movies, cinemas..." />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-medium text-zinc-500 sm:text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <Ticket className="h-3.5 w-3.5 text-pink-300/80" />
              Instant e-tickets
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Armchair className="h-3.5 w-3.5 text-pink-300/80" />
              Pick your exact seat
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-pink-300/80" />
              Secure checkout
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[540px] lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/20 blur-[70px]"
          />

          <div className="animate-hero-float relative">
            <CinemaNightIllustration className="relative mx-auto w-full max-w-[540px] drop-shadow-[0_42px_90px_rgba(190,18,60,0.2)]" />
          </div>

          <div className="absolute right-0 top-5 hidden items-center gap-2 rounded-full border border-pink-300/20 bg-black/45 px-3 py-1.5 text-[10px] font-semibold text-pink-100 backdrop-blur-md sm:flex">
            <Ticket className="h-3.5 w-3.5 text-pink-300" />
            Instant e-ticket
          </div>

          {featuredMovie && (
            <Link
              href={`/movies/${featuredMovie.id}`}
              className="group absolute left-0 top-10 hidden w-[230px] items-center gap-3 rounded-2xl border border-white/10 bg-black/55 p-2.5 shadow-2xl backdrop-blur-xl transition-colors hover:border-pink-400/40 lg:flex"
            >
              <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#140611]">
                {featuredMovie.poster_url ? (
                  <Image
                    src={featuredMovie.poster_url}
                    alt={`${featuredMovie.title} poster`}
                    fill
                    sizes="44px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Film className="h-5 w-5 text-pink-300/50" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-pink-300">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Featured tonight · {formatMovieScore(featuredMovie)}
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-white transition-colors group-hover:text-pink-200">
                  {featuredMovie.title}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                  {featuredMovie.language} · {featuredMovie.duration}
                </p>
              </div>

              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-pink-300" />
            </Link>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </section>
  );
}
