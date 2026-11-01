"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Home, LogIn, Ticket, UserRound } from "lucide-react";

interface BottomNavProps {
  userEmail: string | null;
}

export default function BottomNav({ userEmail }: BottomNavProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  if (pathname === "/book" || pathname.startsWith("/book/")) {
    return null;
  }

  const isMoviesSection =
    pathname.startsWith("/movies") ||
    pathname === "/book" ||
    pathname.startsWith("/book/");
  const isBookingsSection =
    pathname === "/bookings" ||
    pathname.startsWith("/bookings/") ||
    pathname === "/booking" ||
    pathname.startsWith("/booking/");

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Movies", href: "/movies", icon: Film },
    { label: "My Bookings", href: "/bookings", icon: Ticket },
    userEmail
      ? { label: "Profile", href: "/profile", icon: UserRound }
      : { label: "Login", href: "/login", icon: LogIn },
  ];

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === href
              : href === "/movies"
                ? isMoviesSection
                : href === "/bookings"
                  ? isBookingsSection
                  : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              title={href === "/profile" && userEmail ? userEmail : undefined}
              aria-current={isActive ? "page" : undefined}
              className="group flex flex-col items-center gap-1 py-2.5 outline-none"
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200 ${
                  isActive
                    ? "bg-accent/15 text-accent"
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
              </span>
              <span
                className={`text-[10px] font-medium leading-none tracking-wide transition-colors duration-200 sm:text-[11px] ${
                  isActive ? "text-accent" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
