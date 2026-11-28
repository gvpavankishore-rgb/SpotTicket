import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/format";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isSupabaseAdminConfigured) return NextResponse.json({ ok: true });
    const body = await request.json().catch(() => null) as { holdId?: unknown } | null;
    const holdId = typeof body?.holdId === "string" ? body.holdId : "";
    if (!holdId) return NextResponse.json({ ok: true });
    const admin = createAdminClient();
    await admin.rpc("release_seat_hold", { p_user_id: user.id, p_hold_id: holdId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Could not release hold.") }, { status: 500 });
  }
}
