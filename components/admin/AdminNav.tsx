"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  Film,
  LayoutDashboard,
  MapPin,
} from "lucide-react";

interface AdminNavProps {
  userEmail: string | null;
}

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Movies", href: "/admin/movies", icon: Film, exact: false },
  { label: "Locations", href: "/admin/locations", icon: MapPin, exact: false },
  { label: "Theatres", href: "/admin/theatres", icon: Building2, exact: false },
  { label: "Shows", href: "/admin/shows", icon: CalendarClock, exact: false },
];

export default function AdminNav({ userEmail }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <aside className="lg:w-60 lg:shrink-0">
      <div className="lg:sticky lg:top-24">
        <div className="hidden rounded-2xl border border-white/[0.06] bg-surface/80 p-3 lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            Admin panel
          </p>
          <p className="mt-1 truncate text-xs text-zinc-400">
            {userEmail ?? "Signed in"}
          </p>
        </div>

        <nav
          aria-label="Admin sections"
          className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-surface/80 p-1.5 lg:mt-3 lg:flex-col lg:p-2"
        >
          {navItems.map(({ label, href, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors lg:text-sm ${
                  isActive
                    ? "bg-accent text-black"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className="mt-3 hidden items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs font-medium text-zinc-400 transition-colors hover:border-accent/30 hover:text-accent lg:flex"
        >
          Back to site
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
