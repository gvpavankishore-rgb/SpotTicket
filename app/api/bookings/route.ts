import { NextResponse } from "next/server";
import { getShowById } from "@/lib/catalog";
import { getErrorMessage } from "@/lib/format";
import { calculateBookingCharges, roundMoney } from "@/lib/pricing";
import {
  getRazorpayOrder,
  getRazorpayPayment,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import { calculateSeatTotal, normalizeSeatIds } from "@/lib/seats";
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
  snacks?: unknown;
  holdId?: unknown;
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
    const snackSelections = normalizeSnackSelections(body.snacks);
    const holdId = readString(body.holdId) ?? "";

    if (
      !orderId ||
      !paymentId ||
      !signature ||
      !showId ||
      !seats ||
      !snackSelections
    ) {
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

    const snacksResult = await getActiveSnacks();
    const availableSnacks: Snack[] = snacksResult.data;

    if (snacksResult.error && snackSelections.length > 0) {
      return NextResponse.json(
        {
          error:
            "Snacks are not available right now. Contact support with your payment ID.",
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
            "One or more paid snacks are no longer available. Contact support with your payment ID.",
        },
        { status: 409 },
      );
    }

    const seatKey = seats.join(",");
    const seatTotal = calculateSeatTotal(price, seats);
    const glassCharge = show.movies?.is_3d
      ? Math.max(0, Number(show.movies.glass_charge ?? 0) || 0)
      : 0;
    const glassTotal = glassCharge * seats.length;
    const bookingCharges = calculateBookingCharges();
    const totalAmount = roundMoney(
      seatTotal + glassTotal + snackPricing.total + bookingCharges.total,
    );
    const expectedAmount = Math.round(totalAmount * 100);
    const snacksHash = getSnackSignature(snackSelections);
    const order = await getRazorpayOrder(orderId);
    const orderSnacksHash = order.notes?.snacks_hash ?? getSnackSignature([]);
    const orderHoldId = order.notes?.hold_id ?? "";

    if (
      order.id !== orderId ||
      order.amount !== expectedAmount ||
      order.notes?.user_id !== user.id ||
      order.notes?.show_id !== show.id ||
      order.notes?.seats !== seatKey ||
      orderSnacksHash !== snacksHash ||
      (holdId && orderHoldId && holdId !== orderHoldId)
    ) {
      return NextResponse.json(
        {
          error:
            "These payment details do not match the selected show, seats, and snacks.",
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
    if (orderHoldId || holdId) {
      const { data: hold } = await adminSupabase
        .from("seat_holds")
        .select("id, user_id, show_id, seats, expires_at")
        .eq("id", orderHoldId || holdId)
        .maybeSingle();
      const holdSeats = Array.isArray(hold?.seats)
        ? (hold!.seats as string[]).map((s) => s.toUpperCase()).sort()
        : [];
      const holdExpired = !hold?.expires_at || new Date(hold.expires_at).getTime() <= Date.now();
      const seatsMatch = holdSeats.length === seats.length && holdSeats.every((s, i) => s === seats[i]);
      if (!hold || hold.user_id !== user.id || hold.show_id !== show.id || holdExpired || !seatsMatch) {
        return NextResponse.json(
          { error: `Your seat hold expired. Payment ${paymentId} was received; contact support with this payment ID.`, code: "HOLD_EXPIRED" },
          { status: 409 },
        );
      }
    }

    const { data: bookingId, error: insertError } = await adminSupabase.rpc(
      "confirm_booking",
      {
        p_user_id: user.id,
        p_show_id: show.id,
        p_seats: seats,
        p_total_amount: Number(totalAmount.toFixed(2)),
        p_payment_id: paymentId,
        p_items: snackPricing.items.map((item) => ({
          snack_id: item.id,
          name: item.name,
          unit_price: Number(item.price.toFixed(2)),
          quantity: item.quantity,
          line_total: Number((item.price * item.quantity).toFixed(2)),
        })),
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

    if (orderHoldId || holdId) {
      await adminSupabase.rpc("release_seat_hold", {
        p_user_id: user.id,
        p_hold_id: orderHoldId || holdId,
      });
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
