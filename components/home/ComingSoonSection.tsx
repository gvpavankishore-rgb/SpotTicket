import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import SectionHeading from "@/components/home/SectionHeading";
import type { CatalogMovie } from "@/lib/catalog";

interface ComingSoonSectionProps {
  movies: CatalogMovie[];
  locationName?: string | null;
  index?: string;
}

export default function ComingSoonSection({
  movies,
  locationName,
  index = "03",
}: ComingSoonSectionProps) {
  return (
    <section id="coming-soon" className="mt-14 scroll-mt-24 sm:mt-20">
      <SectionHeading
        index={index}
        eyebrow="Coming soon"
        title="Next in the spotlight"
        description={
          locationName
            ? `Fresh titles heading to screens near ${locationName}.`
            : "Fresh titles heading to a screen near you."
        }
      />

      {movies.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} status="comingSoon" />
          ))}
        </div>
      ) : (
        <div className="relative mt-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0d0d0d] px-6 py-12 text-center sm:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_65%_at_50%_0%,rgba(245,158,11,0.12),transparent_70%)]" />
          <div className="film-grain absolute inset-0 opacity-[0.05]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

          <div className="relative mx-auto flex max-w-md flex-col items-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
              <CalendarClock className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-white">
              The next big thing is loading
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              New releases land here first. Until then, the screen is already
              lit for everything showing now.
            </p>
            <Link
              href="/movies"
              className="group mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-amber-400"
            >
              Browse movies
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
