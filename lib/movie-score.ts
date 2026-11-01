import type { CatalogMovie } from "@/lib/catalog";

export function getMovieScore(
  movie: Pick<CatalogMovie, "id" | "title" | "genre">,
) {
  const seed = `${movie.id}:${movie.title}:${movie.genre}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return Math.round((7.2 + (hash % 23) / 10) * 10) / 10;
}

export function formatMovieScore(
  movie: Pick<CatalogMovie, "id" | "title" | "genre">,
) {
  return getMovieScore(movie).toFixed(1);
}

export function sortMoviesByScore(movies: CatalogMovie[]) {
  return [...movies].sort(
    (a, b) =>
      getMovieScore(b) - getMovieScore(a) ||
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
  );
}
