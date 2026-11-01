import { NextResponse } from "next/server";
import { getBookedSeatsForShow } from "@/lib/bookings";
import { getShowById } from "@/lib/catalog";
import { formatShowDate, formatShowTime, getErrorMessage } from "@/lib/format";
import { createRazorpayOrder, getRazorpayConfig } from "@/lib/razorpay";
import {
  MAX_SEATS_PER_BOOKING,
  calculateSeatTotal,
  normalizeSeatIds,
} from "@/lib/seats";
import {
  BOOKING_CLOSED_MESSAGE,
  isShowBookingClosed,
} from "@/lib/show-time";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface OrderRequestBody {
  showId?: unknown;
  seats?: unknown;
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to continue with payment." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | OrderRequestBody
      | null;

    if (!body || typeof body.showId !== "string") {
      return NextResponse.json(
        { error: "A valid show is required to start payment." },
        { status: 400 },
      );
    }

    const seats = normalizeSeatIds(body.seats);

    if (!seats) {
      return NextResponse.json(
        {
          error: `Select between 1 and ${MAX_SEATS_PER_BOOKING} valid seats before paying.`,
        },
        { status: 400 },
      );
    }

    const { data: show, error: showError } = await getShowById(body.showId);

    if (showError) {
      return NextResponse.json({ error: showError }, { status: 500 });
    }

    if (!show) {
      return NextResponse.json(
        { error: "This show could not be found." },
        { status: 404 },
      );
    }

    if (isShowBookingClosed(show.show_date, show.show_time)) {
      return NextResponse.json(
        { error: BOOKING_CLOSED_MESSAGE },
        { status: 409 },
      );
    }

    const price = Number(show.price);
    const seatTotal = calculateSeatTotal(price, seats);
    const amount = Math.round(seatTotal * 100);

    if (!Number.isFinite(price) || price <= 0 || amount < 100) {
      return NextResponse.json(
        { error: "This show does not have a valid ticket price." },
        { status: 400 },
      );
    }

    const { data: bookedSeats, error: availabilityError } =
      await getBookedSeatsForShow(show.id);

    if (availabilityError) {
      return NextResponse.json(
        {
          error:
            "Could not check seat availability. Make sure the bookings SQL has been run in Supabase.",
        },
        { status: 500 },
      );
    }

    const bookedSeatSet = new Set(bookedSeats);
    const unavailableSeats = seats.filter((seat) => bookedSeatSet.has(seat));

    if (unavailableSeats.length > 0) {
      return NextResponse.json(
        {
          error: `Seat${
            unavailableSeats.length > 1 ? "s" : ""
          } ${unavailableSeats.join(
            ", ",
          )} ${unavailableSeats.length > 1 ? "are" : "is"} no longer available. Please choose different seats.`,
        },
        { status: 409 },
      );
    }

    if (!isSupabaseAdminConfigured) {
      return NextResponse.json(
        {
          error:
            "Booking storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local before accepting payments.",
        },
        { status: 500 },
      );
    }

    const movieTitle = show.movies?.title ?? "Movie";
    const theatreName = show.theatres?.name ?? "SpotTicket";
    const showLabel = `${formatShowDate(show.show_date)} at ${formatShowTime(
      show.show_time,
    )}`;
    const description = `${movieTitle} · ${theatreName} · ${showLabel}`;

    const config = getRazorpayConfig();
    const order = await createRazorpayOrder({
      amount,
      receipt: `spotticket_${show.id.slice(0, 8)}_${Date.now().toString(36)}`,
      notes: {
        user_id: user.id,
        show_id: show.id,
        seats: seats.join(","),
      },
    });

    return NextResponse.json(
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: config.keyId,
        description,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(
          error,
          "Could not start payment. Please try again.",
        ),
      },
      { status: 500 },
    );
  }
}
