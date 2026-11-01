import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  Clapperboard,
  Film,
  MapPin,
  Plus,
  Ticket,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  if (!isSupabaseConfigured) {
    redirect("/login");
  }

  const supabase = createClient();

  const [moviesResult, theatresResult, showsResult, locationsResult] =
    await Promise.all([
      supabase.from("movies").select("id", { count: "exact", head: true }),
      supabase.from("theatres").select("id", { count: "exact", head: true }),
      supabase.from("shows").select("id", { count: "exact", head: true }),
      supabase.from("locations").select("id", { count: "exact", head: true }),
    ]);

  const stats = [
    {
      label: "Movies",
      value: moviesResult.count ?? 0,
      href: "/admin/movies",
      icon: Film,
      hint: "Titles in your catalog",
    },
    {
      label: "Locations",
      value: locationsResult.count ?? 0,
      href: "/admin/locations",
      icon: MapPin,
      hint: "Cities you serve",
    },
    {
      label: "Theatres",
      value: theatresResult.count ?? 0,
      href: "/admin/theatres",
      icon: Building2,
      hint: "Venues with screens",
    },
    {
      label: "Shows",
      value: showsResult.count ?? 0,
      href: "/admin/shows",
      icon: CalendarClock,
      hint: "Scheduled screenings",
    },
  ];

  const hasSchemaError = [
    moviesResult,
    theatresResult,
    showsResult,
    locationsResult,
  ].some((result) => Boolean(result.error));

  const quickActions = [
    {
      label: "Add a movie",
      description: "Build out the now-showing catalog.",
      href: "/admin/movies",
      icon: Clapperboard,
    },
    {
      label: "Add a location",
      description: "Open a new city for bookings.",
      href: "/admin/locations",
      icon: MapPin,
    },
    {
      label: "Add a theatre",
      description: "Register a venue and seat count.",
      href: "/admin/theatres",
      icon: Building2,
    },
    {
      label: "Schedule a show",
      description: "Pair a movie with a theatre.",
      href: "/admin/shows",
      icon: Ticket,
    },
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Overview"
        title="Admin dashboard"
        description="Manage the locations, movies, theatres, and shows that power SpotTicket bookings."
      />

      {hasSchemaError && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Database tables are not ready.</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
              Run the SQL in{" "}
              <code className="rounded bg-black/30 px-1 py-0.5">
                supabase/admin-schema.sql
              </code>{" "}
              in the Supabase SQL editor, then refresh this page.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon, hint }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-2xl border border-white/[0.06] bg-surface p-5 transition-colors hover:border-accent/30 hover:bg-accent/[0.04]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <ArrowRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-accent" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-white">
              {value}
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-200">{label}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
          </Link>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-white/[0.06] bg-surface p-5">
        <div className="flex items-center gap-2">
          <span className="h-px w-5 bg-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            Quick actions
          </h2>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ label, description, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3.5 transition-colors hover:border-accent/30 hover:bg-accent/[0.04]"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-sm font-semibold text-white">
                  {label}
                  <Plus className="h-3 w-3 text-zinc-500 transition-colors group-hover:text-accent" />
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
                  {description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
