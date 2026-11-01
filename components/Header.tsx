import Link from "next/link";
import { Ticket } from "lucide-react";
import LocationSelector from "@/components/LocationSelector";
import type { LocationOption } from "@/lib/locations";

interface HeaderProps {
  userEmail: string | null;
  locations: LocationOption[];
  selectedLocationId: string | null;
}

export default function Header({
  userEmail,
  locations,
  selectedLocationId,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="SpotTicket home"
          className="flex min-w-0 items-center gap-2 justify-self-start"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-black shadow-glow sm:h-9 sm:w-9">
            <Ticket className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2.5} />
          </span>
          <span className="truncate text-base font-bold tracking-tight sm:text-xl">
            <span className="text-white">Spot</span>
            <span className="text-accent">Ticket</span>
          </span>
        </Link>

        <LocationSelector
          locations={locations}
          selectedLocationId={selectedLocationId}
        />

        {userEmail ? (
          <Link
            href="/profile"
            title={userEmail}
            aria-label={`Profile for ${userEmail}`}
            className="flex min-w-0 items-center gap-2 justify-self-end rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-1 transition-colors hover:border-accent/30 hover:bg-accent/10 sm:pr-2.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold uppercase text-black">
              {userEmail.charAt(0)}
            </span>
            <span className="hidden max-w-[96px] truncate text-[11px] font-medium text-zinc-300 min-[390px]:inline">
              {userEmail}
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="justify-self-end rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-amber-400"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
