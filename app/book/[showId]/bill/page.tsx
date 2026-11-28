import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BillCheckout from "@/components/BillCheckout";
import { getShowById } from "@/lib/catalog";
import { formatShowDate, formatShowTime } from "@/lib/format";
import { getLocationContext } from "@/lib/locations";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bill Summary | SpotTicket" };

interface BillPageProps { params: { showId: string } }

export default async function BillPage({ params }: BillPageProps) {
  const { selected } = await getLocationContext();
  const { data: show, error } = await getShowById(params.showId, selected?.id);
  if (error) {
    return (
      <div className="animate-page-enter">
        <Link href={`/book/${params.showId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-accent"><ArrowLeft className="h-3.5 w-3.5" />Back to seats</Link>
        <p className="mt-4 text-sm text-red-300">{error}</p>
      </div>
    );
  }
  if (!show) notFound();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/book/${params.showId}/bill`)}`);

  let hold: { holdId: string; seats: string[]; expiresAt: string } | null = null;
  if (isSupabaseAdminConfigured) {
    const admin = createAdminClient();
    const { data } = await admin.rpc("get_active_seat_hold", { p_user_id: user.id, p_show_id: params.showId });
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.hold_id && row?.expires_at && new Date(row.expires_at).getTime() > Date.now()) {
      hold = { holdId: row.hold_id, seats: Array.isArray(row.seats) ? row.seats : [], expiresAt: row.expires_at };
    }
  }

  return (
    <div className="animate-page-enter pb-24">
      <Link href={`/book/${params.showId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-accent">
        <ArrowLeft className="h-3.5 w-3.5" />Back to seats
      </Link>
      <div className="mt-4">
        <BillCheckout
          showId={show.id}
          movieTitle={show.movies?.title ?? "Movie"}
          theatreName={show.theatres?.name ?? "SpotTicket"}
          theatreLocation={show.theatres?.location ?? ""}
          showDateLabel={formatShowDate(show.show_date)}
          showTimeLabel={formatShowTime(show.show_time)}
          basePrice={Number(show.price)}
          is3D={show.movies?.is_3d === true}
          glassCharge={Number(show.movies?.glass_charge ?? 0)}
          hold={hold}
          userEmail={user.email ?? null}
          userPhone={user.phone ?? null}
        />
      </div>
    </div>
  );
}
