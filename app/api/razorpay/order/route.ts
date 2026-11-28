import { NextResponse } from "next/server";
import { getBookedSeatsForShow } from "@/lib/bookings";
import { getShowById } from "@/lib/catalog";
import { formatShowDate, formatShowTime, getErrorMessage } from "@/lib/format";
import { calculateBookingCharges, roundMoney } from "@/lib/pricing";
import { createRazorpayOrder, getRazorpayConfig } from "@/lib/razorpay";
import {
  MAX_SEATS_PER_BOOKING,
  calculateSeatTotal,
  normalizeSeatIds,
} from "@/lib/seats";
import {
  normalizeSnackSelections,
  priceSnackSelections,
  type Snack,
} from "@/lib/snacks";
import { getActiveSnacks, getSnackSignature } from "@/lib/snacks-server";
import {
  BOOKING_CLOSED_MESSAGE,
  isShowBookingClosed,
} from "@/lib/show-time";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface OrderRequestBody {
  showId?: unknown;
  seats?: unknown;
  snacks?: unknown;
  holdId?: unknown;
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

    const snackSelections = normalizeSnackSelections(body.snacks);

    if (!snackSelections) {
      return NextResponse.json(
        { error: "The selected snacks are invalid. Please try again." },
        { status: 400 },
      );
    }

    const holdId = typeof body.holdId === "string" ? body.holdId.trim() : "";

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
    const glassCharge = show.movies?.is_3d
      ? Math.max(0, Number(show.movies.glass_charge ?? 0) || 0)
      : 0;
    const glassTotal = glassCharge * seats.length;

    if (!Number.isFinite(price) || price <= 0 || seatTotal <= 0) {
      return NextResponse.json(
        { error: "This show does not have a valid ticket price." },
        { status: 400 },
      );
    }

    const snacksResult = await getActiveSnacks();
    const availableSnacks: Snack[] = snacksResult.data;

    if (snacksResult.error && snackSelections.length > 0) {
      return NextResponse.json(
        {
          error:
            "Snacks are not available right now. Remove your snacks or try again.",
        },
        { status: 500 },
      );
    }

    const snackPricing = priceSnackSelections(
      snackSelections,
      availableSnacks,
    );

    if (!snackPricing) {
      return NextResponse.json(
        {
          error:
            "One or more selected snacks are no longer available. Please review your snacks and try again.",
        },
        { status: 409 },
      );
    }

    const bookingCharges = calculateBookingCharges();
    const totalAmount = roundMoney(
      seatTotal + glassTotal + snackPricing.total + bookingCharges.total,
    );
    const amount = Math.round(totalAmount * 100);

    if (amount < 100) {
      return NextResponse.json(
        { error: "This show does not have a valid ticket price." },
        { status: 400 },
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

    const adminSupabase = createAdminClient();
    if (holdId) {
      const { data: hold } = await adminSupabase
        .from("seat_holds")
        .select("id, user_id, show_id, seats, expires_at")
        .eq("id", holdId)
        .maybeSingle();

      const holdSeats = Array.isArray(hold?.seats)
        ? (hold.seats as string[]).map((s) => s.toUpperCase()).sort()
        : [];
      const holdExpired = !hold?.expires_at || new Date(hold.expires_at).getTime() <= Date.now();
      const seatsMatch = holdSeats.length === seats.length && holdSeats.every((s, i) => s === seats[i]);

      if (!hold || hold.user_id !== user.id || hold.show_id !== show.id || holdExpired || !seatsMatch) {
        return NextResponse.json(
          { error: "Your seat hold expired or is invalid. Please select seats again.", code: "HOLD_EXPIRED" },
          { status: 409 },
        );
      }
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
        snacks_hash: getSnackSignature(snackSelections),
        hold_id: holdId || "",
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
