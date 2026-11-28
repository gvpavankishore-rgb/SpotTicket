import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/format";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Returns active hold for a show (used by client to restore timer)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showId = searchParams.get("showId") ?? "";
    if (!showId) return NextResponse.json({ hold: null });
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isSupabaseAdminConfigured) return NextResponse.json({ hold: null });
    const admin = createAdminClient();
    const { data } = await admin.rpc("get_active_seat_hold", { p_user_id: user.id, p_show_id: showId });
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.hold_id || new Date(row.expires_at).getTime() <= Date.now()) return NextResponse.json({ hold: null });
    return NextResponse.json({ hold: { holdId: row.hold_id, seats: row.seats, expiresAt: row.expires_at } });
  } catch (e) { return NextResponse.json({ hold: null, error: getErrorMessage(e, "") }); }
}
