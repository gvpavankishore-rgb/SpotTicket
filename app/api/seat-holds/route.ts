import { NextResponse } from "next/server";
import { getShowById } from "@/lib/catalog";
import { getErrorMessage } from "@/lib/format";
import { normalizeSeatIds } from "@/lib/seats";
import { SEAT_HOLD_MINUTES } from "@/lib/seat-hold";
import { BOOKING_CLOSED_MESSAGE, isShowBookingClosed } from "@/lib/show-time";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    if (!isSupabaseAdminConfigured) return NextResponse.json({ error: "Booking storage is not configured." }, { status: 500 });

    const body = await request.json().catch(() => null) as { showId?: unknown; seats?: unknown } | null;
    const showId = typeof body?.showId === "string" ? body.showId : "";
    const seats = normalizeSeatIds(body?.seats);
    if (!showId || !seats) return NextResponse.json({ error: "Invalid seat hold request." }, { status: 400 });

    const { data: show, error: showError } = await getShowById(showId);
    if (showError) return NextResponse.json({ error: showError }, { status: 500 });
    if (!show) return NextResponse.json({ error: "Show not found." }, { status: 404 });
    if (isShowBookingClosed(show.show_date, show.show_time)) {
      return NextResponse.json({ error: BOOKING_CLOSED_MESSAGE }, { status: 409 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("create_seat_hold", {
      p_user_id: user.id, p_show_id: showId, p_seats: seats, p_hold_minutes: SEAT_HOLD_MINUTES,
    });
    if (error) {
      const msg = error.message ?? "";
      if (msg.includes("SEAT_UNAVAILABLE")) {
        const seat = msg.split(":")[1]?.trim();
        return NextResponse.json({ error: seat ? `Seat ${seat} is no longer available.` : "Some selected seats are no longer available." }, { status: 409 });
      }
      if (error.code === "42883" || msg.includes("create_seat_hold")) {
        return NextResponse.json({ error: "Seat hold system is not set up. Run supabase/seat-holds-schema.sql in Supabase." }, { status: 500 });
      }
      return NextResponse.json({ error: getErrorMessage(error, "Could not hold seats.") }, { status: 500 });
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.hold_id || !row?.expires_at) return NextResponse.json({ error: "Could not hold seats." }, { status: 500 });
    return NextResponse.json({ holdId: row.hold_id, expiresAt: row.expires_at, seats }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Could not hold seats.") }, { status: 500 });
  }
}
