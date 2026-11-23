"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Film, Home, LogIn, Menu, Ticket, UserRound, X } from "lucide-react";
import SocialLinks from "@/components/SocialLinks";

interface MobileMenuProps {
  userEmail: string | null;
}

export default function MobileMenu({ userEmail }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Movies", href: "/movies", icon: Film },
    { label: "My Bookings", href: "/bookings", icon: Ticket },
    userEmail
      ? { label: "Profile", href: "/profile", icon: UserRound }
      : { label: "Login", href: "/login", icon: LogIn },
  ];

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-300 transition-colors hover:border-accent/40 hover:text-accent"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="animate-seat-view-rise absolute inset-x-0 top-16 z-30 border-b border-white/[0.08] bg-background/95 p-4 shadow-2xl backdrop-blur-xl"
        >
          <nav aria-label="Mobile navigation" className="grid grid-cols-2 gap-2">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:border-accent/30 hover:text-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Follow SpotTicket
            </p>
            <SocialLinks className="mt-3" />
          </div>
        </div>
      )}
    </div>
  );
}
