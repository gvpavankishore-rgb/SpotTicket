import CatalogError from "@/components/CatalogError";
import MoviesExplorer from "@/components/MoviesExplorer";
import { getMovies } from "@/lib/catalog";
import { getLocationContext } from "@/lib/locations";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Movies | SpotTicket",
};

interface MoviesPageProps {
  searchParams?: {
    search?: string | string[];
  };
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const { selected } = await getLocationContext();
  const { data: movies, error } = await getMovies(selected?.id);
  const initialQuery =
    typeof searchParams?.search === "string" ? searchParams.search : "";

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="h-px w-5 bg-accent" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          Browse
        </span>
      </div>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {selected ? `Movies in ${selected.name}` : "Movies near you"}
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        {selected
          ? `All the latest releases playing in ${selected.name}.`
          : "All the latest releases playing near you."}
      </p>

      {error ? (
        <div className="mt-6">
          <CatalogError message={error} />
        </div>
      ) : (
        <MoviesExplorer key={initialQuery} movies={movies} initialQuery={initialQuery} />
      )}
    </div>
  );
}
