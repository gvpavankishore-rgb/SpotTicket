import { getErrorMessage, getTodayDateKey } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface CatalogMovie {
  id: string;
  title: string;
  language: string;
  genre: string;
  duration: string;
  poster_url: string;
  trailer_url: string | null;
  description: string | null;
  created_at: string;
}

export interface CatalogTheatre {
  id: string;
  name: string;
  location: string;
  total_seats: number;
}

export interface CatalogShow {
  id: string;
  movie_id: string;
  theatre_id: string;
  show_date: string;
  show_time: string;
  price: number;
  theatres: CatalogTheatre | null;
}

export interface BookingShow extends CatalogShow {
  movies: CatalogMovie | null;
}

export interface CatalogResult<T> {
  data: T;
  error: string | null;
}

type Embedded<T> = T | T[] | null;

interface RawCatalogShow extends Omit<CatalogShow, "theatres"> {
  theatres: Embedded<CatalogTheatre>;
}

interface RawBookingShow extends Omit<BookingShow, "movies" | "theatres"> {
  movies: Embedded<CatalogMovie>;
  theatres: Embedded<CatalogTheatre>;
}

function singleRelation<T>(value: Embedded<T> | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return uuidPattern.test(value);
}

export async function getMovies(
  locationId?: string | null,
): Promise<CatalogResult<CatalogMovie[]>> {
  if (!isSupabaseConfigured) {
    return {
      data: [],
      error:
        "Supabase is not configured. Add your project credentials to .env.local.",
    };
  }

  try {
    const supabase = createClient();
    let query = supabase
      .from("movies")
      .select(
        "*, shows!inner(show_date, theatres!inner(location_id))",
      )
      .gte("shows.show_date", getTodayDateKey());

    if (locationId) {
      query = query.eq("shows.theatres.location_id", locationId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      return { data: [], error: error.message };
    }

    const movies = new Map<string, CatalogMovie>();

    for (const row of (data ?? []) as (CatalogMovie & {
      shows?: unknown;
    })[]) {
      const { shows, ...movie } = row;
      void shows;
      movies.set(movie.id, movie);
    }

    return { data: Array.from(movies.values()), error: null };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error, "Could not load movies."),
    };
  }
}

export async function getComingSoonMovies(
  locationId?: string | null,
): Promise<CatalogResult<CatalogMovie[]>> {
  if (!isSupabaseConfigured) {
    return {
      data: [],
      error:
        "Supabase is not configured. Add your project credentials to .env.local.",
    };
  }

  try {
    const supabase = createClient();
    let showsQuery = supabase
      .from("shows")
      .select("movie_id, theatres!inner(location_id)")
      .gte("show_date", getTodayDateKey());

    if (locationId) {
      showsQuery = showsQuery.eq("theatres.location_id", locationId);
    }

    const [moviesResult, showsResult] = await Promise.all([
      supabase
        .from("movies")
        .select("*")
        .order("created_at", { ascending: false }),
      showsQuery,
    ]);

    if (moviesResult.error) {
      return { data: [], error: moviesResult.error.message };
    }

    if (showsResult.error) {
      return { data: [], error: showsResult.error.message };
    }

    const showingIds = new Set(
      ((showsResult.data ?? []) as { movie_id: string }[]).map(
        (show) => show.movie_id,
      ),
    );

    const comingSoon = ((moviesResult.data ?? []) as CatalogMovie[]).filter(
      (movie) => !showingIds.has(movie.id),
    );

    return { data: comingSoon, error: null };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error, "Could not load upcoming movies."),
    };
  }
}

export async function getMovieById(
  id: string,
): Promise<CatalogResult<CatalogMovie | null>> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error:
        "Supabase is not configured. Add your project credentials to .env.local.",
    };
  }

  if (!isUuid(id)) {
    return { data: null, error: null };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as CatalogMovie | null) ?? null, error: null };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error, "Could not load the movie."),
    };
  }
}

export async function getUpcomingShowsForMovie(
  movieId: string,
  locationId?: string | null,
): Promise<CatalogResult<CatalogShow[]>> {
  if (!isSupabaseConfigured) {
    return {
      data: [],
      error:
        "Supabase is not configured. Add your project credentials to .env.local.",
    };
  }

  if (!isUuid(movieId)) {
    return { data: [], error: null };
  }

  try {
    const supabase = createClient();
    let query = supabase
      .from("shows")
      .select(
        "id, movie_id, theatre_id, show_date, show_time, price, theatres!inner(id, name, location, total_seats)",
      )
      .eq("movie_id", movieId)
      .gte("show_date", getTodayDateKey());

    if (locationId) {
      query = query.eq("theatres.location_id", locationId);
    }

    const { data, error } = await query
      .order("show_date", { ascending: true })
      .order("show_time", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    const shows = ((data ?? []) as unknown as RawCatalogShow[]).map((show) => ({
      ...show,
      theatres: singleRelation(show.theatres),
    }));

    return { data: shows, error: null };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error, "Could not load shows."),
    };
  }
}

export async function getShowtimesForMovieAtTheatreOnDate(
  movieId: string,
  theatreId: string,
  showDate: string,
): Promise<CatalogResult<CatalogShow[]>> {
  if (!isSupabaseConfigured) {
    return {
      data: [],
      error:
        "Supabase is not configured. Add your project credentials to .env.local.",
    };
  }

  if (!isUuid(movieId) || !isUuid(theatreId) || !showDate) {
    return { data: [], error: null };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("shows")
      .select(
        "id, movie_id, theatre_id, show_date, show_time, price, theatres(id, name, location, total_seats)",
      )
      .eq("movie_id", movieId)
      .eq("theatre_id", theatreId)
      .eq("show_date", showDate)
      .order("show_time", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    const shows = ((data ?? []) as unknown as RawCatalogShow[]).map((show) => ({
      ...show,
      theatres: singleRelation(show.theatres),
    }));

    return { data: shows, error: null };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error, "Could not load showtimes."),
    };
  }
}

export async function getShowById(
  id: string,
  locationId?: string | null,
): Promise<CatalogResult<BookingShow | null>> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error:
        "Supabase is not configured. Add your project credentials to .env.local.",
    };
  }

  if (!isUuid(id)) {
    return { data: null, error: null };
  }

  try {
    const supabase = createClient();
    let query = supabase
      .from("shows")
      .select(
        "id, movie_id, theatre_id, show_date, show_time, price, movies(id, title, language, genre, duration, poster_url, trailer_url, description, created_at), theatres!inner(id, name, location, total_seats)",
      )
      .eq("id", id);

    if (locationId) {
      query = query.eq("theatres.location_id", locationId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    const rawShow = data as unknown as RawBookingShow | null;
    const show = rawShow
      ? {
          ...rawShow,
          movies: singleRelation(rawShow.movies),
          theatres: singleRelation(rawShow.theatres),
        }
      : null;

    return { data: show, error: null };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error, "Could not load the show."),
    };
  }
}
