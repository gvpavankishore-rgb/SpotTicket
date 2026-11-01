import type { CatalogResult } from "@/lib/catalog";
import { getErrorMessage } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface BookingMovieSummary {
  id: string;
  title: string;
  poster_url: string;
}

export interface BookingTheatreSummary {
  id: string;
  name: string;
  location: string;
}

export interface BookingShowSummary {
  id: string;
  show_date: string;
  show_time: string;
  price: number;
  movies: BookingMovieSummary | null;
  theatres: BookingTheatreSummary | null;
}

export interface BookingDetails {
  id: string;
  user_id: string;
  show_id: string;
  seats: string[];
  total_amount: number;
  payment_id: string;
  status: string;
  created_at: string;
  shows: BookingShowSummary | null;
}

type Embedded<T> = T | T[] | null;

interface RawBookingShow
  extends Omit<BookingShowSummary, "movies" | "theatres"> {
  movies: Embedded<BookingMovieSummary>;
  theatres: Embedded<BookingTheatreSummary>;
}

interface RawBooking extends Omit<BookingDetails, "shows" | "total_amount"> {
  total_amount: number | string;
  shows: Embedded<RawBookingShow>;
}

const BOOKING_SELECT = `
  id,
  user_id,
  show_id,
  seats,
  total_amount,
  payment_id,
  status,
  created_at,
  shows(
    id,
    show_date,
    show_time,
    price,
    movies(id, title, poster_url),
    theatres(id, name, location)
  )
`;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return uuidPattern.test(value);
}

function singleRelation<T>(value: Embedded<T> | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeBooking(raw: RawBooking): BookingDetails {
  const show = singleRelation(raw.shows);

  return {
    ...raw,
    seats: Array.isArray(raw.seats) ? raw.seats : [],
    total_amount: Number(raw.total_amount),
    shows: show
      ? {
          ...show,
          movies: singleRelation(show.movies),
          theatres: singleRelation(show.theatres),
        }
      : null,
  };
}

export async function getBookingById(
  id: string,
  userId: string,
): Promise<CatalogResult<BookingDetails | null>> {
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
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: data ? normalizeBooking(data as unknown as RawBooking) : null,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error, "Could not load this booking."),
    };
  }
}

export async function getBookingsForUser(
  userId: string,
): Promise<CatalogResult<BookingDetails[]>> {
  if (!isSupabaseConfigured) {
    return {
      data: [],
      error:
        "Supabase is not configured. Add your project credentials to .env.local.",
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return {
      data: ((data ?? []) as unknown as RawBooking[]).map(normalizeBooking),
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error, "Could not load your bookings."),
    };
  }
}

export async function getBookedSeatsForShow(
  showId: string,
): Promise<CatalogResult<string[]>> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  if (!isUuid(showId)) {
    return { data: [], error: null };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_booked_seats", {
      p_show_id: showId,
    });

    if (error) {
      return { data: [], error: error.message };
    }

    const seats = Array.isArray(data)
      ? data.filter((seat): seat is string => typeof seat === "string")
      : [];

    return { data: seats, error: null };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error, "Could not load booked seats."),
    };
  }
}
