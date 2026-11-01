"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import MovieCard from "@/components/MovieCard";
import type { CatalogMovie } from "@/lib/catalog";

interface MoviesExplorerProps {
  movies: CatalogMovie[];
  initialQuery?: string;
}

export default function MoviesExplorer({
  movies,
  initialQuery = "",
}: MoviesExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [language, setLanguage] = useState("all");
  const [genre, setGenre] = useState("all");

  const languages = useMemo(
    () =>
      Array.from(new Set(movies.map((movie) => movie.language).filter(Boolean))).sort(),
    [movies],
  );

  const genres = useMemo(
    () =>
      Array.from(new Set(movies.map((movie) => movie.genre).filter(Boolean))).sort(),
    [movies],
  );

  const filteredMovies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return movies.filter((movie) => {
      const matchesQuery =
        !normalizedQuery ||
        [movie.title, movie.language, movie.genre, movie.description ?? ""].some(
          (value) => value.toLowerCase().includes(normalizedQuery),
        );
      const matchesLanguage =
        language === "all" || movie.language === language;
      const matchesGenre = genre === "all" || movie.genre === genre;

      return matchesQuery && matchesLanguage && matchesGenre;
    });
  }, [movies, query, language, genre]);

  const hasFilters =
    query.trim() !== "" || language !== "all" || genre !== "all";

  function clearFilters() {
    setQuery("");
    setLanguage("all");
    setGenre("all");
  }

  if (movies.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          title="No movies yet"
          description="New releases will appear here as soon as they are added to SpotTicket."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mt-6 rounded-2xl border border-white/[0.06] bg-surface p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px_160px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search movies, genres, languages..."
              aria-label="Search movies"
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-black/30 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              aria-label="Filter by language"
              className="h-11 w-full appearance-none rounded-xl border border-white/[0.08] bg-black/30 pl-10 pr-8 text-sm text-white outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">All languages</option>
              {languages.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          </div>

          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <select
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              aria-label="Filter by genre"
              className="h-11 w-full appearance-none rounded-xl border border-white/[0.08] bg-black/30 pl-10 pr-8 text-sm text-white outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">All genres</option>
              {genres.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500" aria-live="polite">
            Showing {filteredMovies.length} of {movies.length} movies
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-accent/30 hover:text-accent"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filteredMovies.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={SearchX}
            title="No matches found"
            description="Try a different search term or clear the filters to see all movies."
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-amber-400"
              >
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
