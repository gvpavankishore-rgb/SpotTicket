import { NextResponse } from "next/server";
import { getShowById } from "@/lib/catalog";
import { getErrorMessage } from "@/lib/format";
import {
  getRazorpayOrder,
  getRazorpayPayment,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import { calculateSeatTotal, normalizeSeatIds } from "@/lib/seats";
import {
  BOOKING_CLOSED_MESSAGE,
  isShowBookingClosed,
} from "@/lib/show-time";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface BookingRequestBody {
  razorpay_order_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_signature?: unknown;
  showId?: unknown;
  seats?: unknown;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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
        { error: "Please sign in to confirm this booking." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | BookingRequestBody
      | null;

    if (!body) {
      return NextResponse.json(
        { error: "Missing payment details." },
        { status: 400 },
      );
    }

    const orderId = readString(body.razorpay_order_id);
    const paymentId = readString(body.razorpay_payment_id);
    const signature = readString(body.razorpay_signature);
    const showId = readString(body.showId);
    const seats = normalizeSeatIds(body.seats);

    if (!orderId || !paymentId || !signature || !showId || !seats) {
      return NextResponse.json(
        { error: "The payment details are incomplete or invalid." },
        { status: 400 },
      );
    }

    if (
      !verifyRazorpaySignature({
        orderId,
        paymentId,
        signature,
      })
    ) {
      return NextResponse.json(
        { error: "Payment verification failed. Please try again." },
        { status: 400 },
      );
    }

    const { data: show, error: showError } = await getShowById(showId);

    if (showError) {
      return NextResponse.json({ error: showError }, { status: 500 });
    }

    if (!show) {
      return NextResponse.json(
        { error: "This show could not be found." },
        { status: 404 },
      );
    }

    const price = Number(show.price);

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "This show does not have a valid ticket price." },
        { status: 400 },
      );
    }

    const seatKey = seats.join(",");
    const seatTotal = calculateSeatTotal(price, seats);
    const expectedAmount = Math.round(seatTotal * 100);
    const order = await getRazorpayOrder(orderId);

    if (
      order.id !== orderId ||
      order.amount !== expectedAmount ||
      order.notes?.user_id !== user.id ||
      order.notes?.show_id !== show.id ||
      order.notes?.seats !== seatKey
    ) {
      return NextResponse.json(
        {
          error:
            "These payment details do not match the selected show and seats.",
        },
        { status: 400 },
      );
    }

    const payment = await getRazorpayPayment(paymentId);

    if (
      payment.order_id !== orderId ||
      payment.amount !== order.amount ||
      payment.currency !== "INR" ||
      !["authorized", "captured"].includes(payment.status)
    ) {
      return NextResponse.json(
        {
          error: `Payment ${paymentId} is not complete. If money was deducted, contact support.`,
        },
        { status: 400 },
      );
    }

    const { data: existingBooking, error: existingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("payment_id", paymentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        {
          error:
            "Could not check this payment. Make sure the bookings table is set up.",
        },
        { status: 500 },
      );
    }

    if (existingBooking) {
      return NextResponse.json({ bookingId: existingBooking.id });
    }

    if (isShowBookingClosed(show.show_date, show.show_time)) {
      return NextResponse.json(
        {
          error: `${BOOKING_CLOSED_MESSAGE} Payment ${paymentId} was received; contact support for a refund.`,
        },
        { status: 409 },
      );
    }

    const adminSupabase = createAdminClient();
    const { data: bookingId, error: insertError } = await adminSupabase.rpc(
      "confirm_booking",
      {
        p_user_id: user.id,
        p_show_id: show.id,
        p_seats: seats,
        p_total_amount: Number(seatTotal.toFixed(2)),
        p_payment_id: paymentId,
      },
    );

    if (insertError) {
      const errorMessage = insertError.message ?? "";

      if (errorMessage.includes("SEAT_UNAVAILABLE")) {
        return NextResponse.json(
          {
            error: `Payment ${paymentId} was received, but one or more selected seats were just booked by someone else. Contact support with this payment ID for a refund.`,
          },
          { status: 409 },
        );
      }

      if (
        insertError.code === "42883" ||
        errorMessage.includes("confirm_booking")
      ) {
        return NextResponse.json(
          {
            error:
              "Booking storage is not up to date. Run supabase/bookings-schema.sql in Supabase, then contact support with your payment ID.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          error: `Payment ${paymentId} was received, but we could not save your booking. Contact support with this payment ID.`,
        },
        { status: 500 },
      );
    }

    if (typeof bookingId !== "string" || !bookingId) {
      return NextResponse.json(
        {
          error: `Payment ${paymentId} was received, but we could not save your booking. Contact support with this payment ID.`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ bookingId }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(
          error,
          "Payment was received, but we could not confirm your booking. Please contact support.",
        ),
      },
      { status: 500 },
    );
  }
}
