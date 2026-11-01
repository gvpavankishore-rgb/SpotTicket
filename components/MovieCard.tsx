import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock, Film, Star } from "lucide-react";
import type { CatalogMovie } from "@/lib/catalog";
import { formatMovieScore } from "@/lib/movie-score";

interface MovieCardProps {
  movie: CatalogMovie;
  status?: "nowShowing" | "comingSoon";
}

export default function MovieCard({
  movie,
  status = "nowShowing",
}: MovieCardProps) {
  const isComingSoon = status === "comingSoon";

  return (
    <article className="group min-w-0">
      <Link
        href={`/movies/${movie.id}`}
        className="block rounded-[1.35rem] outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`View ${movie.title}`}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[1.35rem] border border-white/[0.07] bg-surface shadow-[0_20px_45px_-24px_rgba(0,0,0,0.95)] transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:border-accent/35 group-hover:shadow-[0_30px_65px_-24px_rgba(245,158,11,0.35)]">
          {movie.poster_url ? (
            <Image
              src={movie.poster_url}
              alt={`${movie.title} poster`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1c1709] via-[#141414] to-[#0b0b0b]">
              <Film className="h-10 w-10 text-accent/50" strokeWidth={1.25} />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {isComingSoon ? (
            <span className="absolute left-2.5 top-2.5 rounded-full border border-red-300/20 bg-[#7f1d1d]/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-red-50 backdrop-blur-md">
              Coming Soon
            </span>
          ) : (
            <span
              title={`SpotScore ${formatMovieScore(movie)} out of 10`}
              className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-accent/25 bg-black/60 px-2 py-1 text-[10px] font-bold text-accent backdrop-blur-md"
            >
              <Star className="h-2.5 w-2.5 fill-current" />
              {formatMovieScore(movie)}
            </span>
          )}

          <span className="absolute right-2.5 top-2.5 rounded-full border border-white/10 bg-black/60 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/85 backdrop-blur-md">
            {movie.language}
          </span>

          <span className="absolute bottom-2.5 left-2.5 max-w-[58%] truncate rounded-md bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black">
            {movie.genre}
          </span>

          <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/55 px-1.5 py-0.5 text-[9px] font-medium text-white/85 backdrop-blur-md">
            <Clock className="h-2.5 w-2.5" />
            {movie.duration}
          </span>

          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="flex h-11 w-11 scale-90 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-xl backdrop-blur-md transition-transform duration-300 group-hover:scale-100">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </span>
        </div>

        <div className="mt-3 px-0.5">
          <h3 className="truncate text-sm font-semibold leading-snug text-white transition-colors group-hover:text-accent sm:text-base">
            {movie.title}
          </h3>
          <p className="mt-1 truncate text-[11px] text-zinc-500 sm:text-xs">
            {movie.genre} · {movie.duration}
          </p>
        </div>
      </Link>
    </article>
  );
}
