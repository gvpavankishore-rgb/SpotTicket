import Link from "next/link";
import { ArrowUpRight, Film, MapPin, Ticket } from "lucide-react";

interface HomeFooterProps {
  locationName?: string | null;
}

const marqueeText =
  "Big screen · Better seats · Zero queues · SpotTicket · ";

const exploreLinks = [
  { label: "Now Showing", href: "#now-showing" },
  { label: "Popular", href: "#popular" },
  { label: "Coming Soon", href: "#coming-soon" },
  { label: "All movies", href: "/movies" },
];

const accountLinks = [
  { label: "Book tickets", href: "/movies" },
  { label: "My bookings", href: "/bookings" },
  { label: "Profile", href: "/profile" },
  { label: "Sign in", href: "/login" },
];

export default function HomeFooter({ locationName }: HomeFooterProps) {
  return (
    <footer className="relative left-1/2 -mb-28 mt-16 w-screen -translate-x-1/2 overflow-hidden border-t border-white/[0.06] bg-[#070707] sm:mt-24">
      <div className="film-grain pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />

      <div
        aria-hidden="true"
        className="relative flex overflow-hidden border-b border-white/[0.06] py-3"
      >
        {[0, 1].map((track) => (
          <div
            key={track}
            className="animate-marquee flex w-max shrink-0 gap-8 pr-8 text-[10px] font-semibold uppercase tracking-[0.32em] text-accent/60"
          >
            {[0, 1, 2, 3].map((item) => (
              <span key={item} className="whitespace-nowrap">
                {marqueeText}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-12 sm:px-6 sm:pb-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              aria-label="SpotTicket home"
              className="inline-flex items-center gap-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-black shadow-glow">
                <Ticket className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">Spot</span>
                <span className="text-accent">Ticket</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
              Cinema, curated. We put the best screens, the right seats, and a
              little opening-night magic in one place.
            </p>

            {locationName && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-zinc-300">
                <MapPin className="h-3 w-3 text-accent" />
                Currently exploring {locationName}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Explore
            </h3>
            <ul className="mt-4 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-accent"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Your night out
            </h3>
            <ul className="mt-4 space-y-3">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-accent"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-[11px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SpotTicket. All stories reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            Made for the dark room
            <Film className="h-3 w-3 text-accent/60" />
          </p>
        </div>
      </div>
    </footer>
  );
}
