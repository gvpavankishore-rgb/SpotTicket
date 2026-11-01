"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { LOCATION_COOKIE } from "@/lib/location-cookie";
import type { LocationOption } from "@/lib/locations";

interface LocationSelectorProps {
  locations: LocationOption[];
  selectedLocationId: string | null;
}

export default function LocationSelector({
  locations,
  selectedLocationId,
}: LocationSelectorProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedLocation =
    locations.find((location) => location.id === selectedLocationId) ?? null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function selectLocation(locationId: string) {
    setIsOpen(false);

    if (locationId === selectedLocationId) {
      return;
    }

    const secure =
      window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LOCATION_COOKIE}=${encodeURIComponent(
      locationId,
    )}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;

    try {
      window.localStorage.setItem(LOCATION_COOKIE, locationId);
    } catch {
      void 0;
    }

    router.refresh();
  }

  if (locations.length === 0) {
    return (
      <span
        title="No active locations available"
        className="flex max-w-[150px] items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[12px] font-medium text-zinc-500 sm:gap-2 sm:px-3 sm:text-sm"
      >
        <MapPin className="h-4 w-4 shrink-0 text-accent/60" strokeWidth={2.5} />
        <span className="truncate">Select location</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select location"
        className="flex max-w-[150px] items-center gap-1.5 rounded-full border border-transparent px-2 py-1.5 text-[13px] font-medium text-white transition-colors hover:border-white/10 hover:bg-white/[0.03] sm:gap-2 sm:px-3 sm:text-sm"
      >
        <MapPin className="h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} />
        <span className="truncate">
          {selectedLocation?.name ?? "Select location"}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Locations"
          className="absolute left-1/2 top-full z-50 mt-2 w-52 -translate-x-1/2 overflow-hidden rounded-xl border border-white/[0.08] bg-[#121212] p-1.5 shadow-2xl shadow-black/60"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Choose city
          </p>
          <div className="max-h-64 overflow-y-auto">
            {locations.map((location) => {
              const isSelected = location.id === selectedLocationId;

              return (
                <button
                  key={location.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectLocation(location.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-accent/10 text-accent"
                      : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span className="truncate">{location.name}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
