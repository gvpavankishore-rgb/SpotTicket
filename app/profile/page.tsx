import Link from "next/link";
import {
  ChevronRight,
  CreditCard,
  MapPin,
  Settings,
  UserRound,
} from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Profile | SpotTicket",
};

const menuItems = [
  { label: "Saved locations", icon: MapPin },
  { label: "Payment methods", icon: CreditCard },
  { label: "Settings", icon: Settings },
];

export default async function ProfilePage() {
  let userEmail: string | null = null;

  if (isSupabaseConfigured) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Profile
      </h1>

      <section className="mt-6 flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-surface p-4 sm:p-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/15 text-lg font-bold uppercase text-accent">
          {userEmail ? userEmail.charAt(0) : <UserRound className="h-7 w-7" strokeWidth={1.75} />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-white sm:text-lg">
            {userEmail ?? "Guest user"}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">
            {userEmail
              ? "Manage your SpotTicket account."
              : "Sign in to sync your bookings across devices."}
          </p>
        </div>

        {!userEmail && (
          <Link
            href="/login"
            className="shrink-0 rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-amber-400"
          >
            Login
          </Link>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-surface">
        {menuItems.map(({ label, icon: Icon }, index) => (
          <button
            key={label}
            type="button"
            className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-white/[0.03] ${
              index !== menuItems.length - 1 ? "border-b border-white/[0.06]" : ""
            }`}
          >
            <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
            <span className="flex-1 text-sm font-medium text-zinc-200">
              {label}
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </button>
        ))}
      </section>

      {userEmail && <LogoutButton />}
    </div>
  );
}
