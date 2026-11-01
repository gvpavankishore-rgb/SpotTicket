"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarX2,
  LockKeyhole,
  MapPin,
  SlidersHorizontal,
  Ticket,
} from "lucide-react";
import type { CatalogShow } from "@/lib/catalog";
import { formatPrice, formatShowTime } from "@/lib/format";
import {
  BOOKING_CLOSED_MESSAGE,
  isShowBookingClosed,
} from "@/lib/show-time";

type TimeFilter = "all" | "before5" | "after5";

interface MovieShowtimesProps {
  shows: CatalogShow[];
  todayKey: string;
  nowMs: number;
  locationName?: string | null;
}

interface DateOption {
  key: string;
  weekday: string;
  dayNumber: number;
  month: string;
  isToday: boolean;
  isTomorrow: boolean;
}

const DAY_WINDOW = 8;

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "All shows" },
  { value: "before5", label: "Before 5 PM" },
  { value: "after5", label: "After 5 PM" },
];

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, (month || 1) - 1, day || 1);
}

function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(key: string, days: number) {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);

  return toDateKey(date);
}

function buildDateOption(key: string, todayKey: string): DateOption {
  const date = parseDateKey(key);

  return {
    key,
    weekday: date.toLocaleDateString("en-IN", { weekday: "short" }),
    dayNumber: date.getDate(),
    month: date.toLocaleDateString("en-IN", { month: "short" }),
    isToday: key === todayKey,
    isTomorrow: key === addDays(todayKey, 1),
  };
}

function describeDate(option: DateOption) {
  if (option.isToday) {
    return "Today";
  }

  if (option.isTomorrow) {
    return "Tomorrow";
  }

  return `${option.weekday}, ${option.dayNumber} ${option.month}`;
}

export default function MovieShowtimes({
  shows,
  todayKey,
  nowMs,
  locationName,
}: MovieShowtimesProps) {
  const [currentTimeMs, setCurrentTimeMs] = useState(nowMs);

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTimeMs(Date.now());

    updateCurrentTime();
    const interval = window.setInterval(updateCurrentTime, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  const bookingClosedByShowId = useMemo(() => {
    const now = new Date(currentTimeMs);

    return new Map(
      shows.map((show) => [
        show.id,
        isShowBookingClosed(show.show_date, show.show_time, now),
      ]),
    );
  }, [shows, currentTimeMs]);

  const bookableShowCount = useMemo(
    () =>
      shows.reduce(
        (count, show) =>
          count + (bookingClosedByShowId.get(show.id) ? 0 : 1),
        0,
      ),
    [shows, bookingClosedByShowId],
  );

  const dates = useMemo(() => {
    const baseKeys = Array.from({ length: DAY_WINDOW }, (_, index) =>
      addDays(todayKey, index),
    );
    const baseSet = new Set(baseKeys);
    const extraKeys = Array.from(
      new Set(shows.map((show) => show.show_date)),
    )
      .filter((key) => key >= todayKey && !baseSet.has(key))
      .sort();

    return [...baseKeys, ...extraKeys]
      .sort()
      .map((key) => buildDateOption(key, todayKey));
  }, [shows, todayKey]);

  const showsByDate = useMemo(() => {
    const map = new Map<string, CatalogShow[]>();

    for (const show of shows) {
      const list = map.get(show.show_date);

      if (list) {
        list.push(show);
      } else {
        map.set(show.show_date, [show]);
      }
    }

    return map;
  }, [shows]);

  const [selectedDate, setSelectedDate] = useState(() => {
    const todayOption = dates[0]?.key ?? todayKey;

    if ((showsByDate.get(todayOption)?.length ?? 0) > 0) {
      return todayOption;
    }

    return (
      dates.find(
        (option) => (showsByDate.get(option.key)?.length ?? 0) > 0,
      )?.key ?? todayOption
    );
  });

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const selectedDateOption =
    dates.find((option) => option.key === selectedDate) ?? dates[0];
  const selectedDateLabel = selectedDateOption
    ? describeDate(selectedDateOption)
    : "this date";
  const showsForDate = useMemo(
    () => showsByDate.get(selectedDate) ?? [],
    [showsByDate, selectedDate],
  );
  const totalShowsForDate = showsForDate.length;

  const filteredShows = useMemo(
    () =>
      showsForDate.filter((show) => {
        if (timeFilter === "all") {
          return true;
        }

        const hour = Number(show.show_time.slice(0, 2));

        if (!Number.isFinite(hour)) {
          return true;
        }

        return timeFilter === "before5" ? hour < 17 : hour >= 17;
      }),
    [showsForDate, timeFilter],
  );

  const theatreGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        id: string;
        name: string;
        location: string;
        shows: CatalogShow[];
        minPrice: number;
      }
    >();

    for (const show of filteredShows) {
      const theatre = show.theatres;
      const id = show.theatre_id || theatre?.id || "unknown";
      const price = Number(show.price);
      const existing = groups.get(id);

      if (existing) {
        existing.shows.push(show);
        existing.minPrice = Math.min(existing.minPrice, price);
      } else {
        groups.set(id, {
          id,
          name: theatre?.name ?? "Theatre to be announced",
          location: theatre?.location ?? "",
          shows: [show],
          minPrice: price,
        });
      }
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        shows: [...group.shows].sort((a, b) =>
          a.show_time.localeCompare(b.show_time),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredShows]);

  const nextAvailableDate = useMemo(
    () =>
      dates.find(
        (option) =>
          option.key > selectedDate &&
          (showsByDate.get(option.key)?.length ?? 0) > 0,
      ) ?? null,
    [dates, selectedDate, showsByDate],
  );

  return (
    <section id="showtimes" className="mt-8 scroll-mt-24 sm:mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-5 bg-accent" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Book tickets
            </span>
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
            Choose your show
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-zinc-500">
            Pick a date, theatre, and showtime. Your seats are one tap away.
          </p>
        </div>

        {shows.length > 0 && (
          <span
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium ${
              bookableShowCount > 0
                ? "border-white/[0.08] bg-white/[0.03] text-zinc-400"
                : "border-rose-400/20 bg-rose-500/[0.08] text-rose-200/80"
            }`}
          >
            {bookableShowCount > 0
              ? `${bookableShowCount} ${
                  bookableShowCount === 1 ? "show" : "shows"
                } available`
              : "All shows closed"}
          </span>
        )}
      </div>

      <div className="mt-5 rounded-3xl border border-white/[0.06] bg-surface/80 p-4 shadow-[0_35px_90px_-55px_rgba(0,0,0,0.95)] backdrop-blur-sm sm:p-5">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5 scroll-px-1 sm:gap-2.5">
          {dates.map((option) => {
            const count = showsByDate.get(option.key)?.length ?? 0;
            const isSelected = option.key === selectedDate;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedDate(option.key)}
                aria-pressed={isSelected}
                aria-label={`${describeDate(option)}, ${
                  count > 0 ? `${count} shows available` : "no shows"
                }`}
                className={`flex min-w-[64px] shrink-0 flex-col items-center rounded-2xl border px-3 py-2.5 transition-all duration-200 sm:min-w-[72px] ${
                  isSelected
                    ? "border-accent bg-accent text-black shadow-[0_10px_30px_-12px_rgba(245,158,11,0.6)]"
                    : count > 0
                      ? "border-white/10 bg-white/[0.03] text-white hover:border-accent/40 hover:bg-white/[0.06]"
                      : "border-white/[0.06] bg-white/[0.015] text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                }`}
              >
                <span
                  className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${
                    isSelected ? "text-black/70" : "text-zinc-500"
                  }`}
                >
                  {option.isToday
                    ? "Today"
                    : option.isTomorrow
                      ? "Tomorrow"
                      : option.weekday}
                </span>
                <span className="mt-0.5 text-lg font-bold leading-none">
                  {option.dayNumber}
                </span>
                <span
                  className={`mt-1 text-[10px] font-medium ${
                    isSelected ? "text-black/70" : "text-zinc-500"
                  }`}
                >
                  {option.month}
                </span>
                <span
                  className={`mt-1 h-1 w-1 rounded-full ${
                    isSelected
                      ? "bg-black/50"
                      : count > 0
                        ? "bg-accent"
                        : "bg-zinc-700"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {TIME_FILTERS.map((filter) => {
              const isActive = filter.value === timeFilter;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setTimeFilter(filter.value)}
                  aria-pressed={isActive}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    isActive
                      ? "border-accent/40 bg-accent/15 text-accent"
                      : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/15 hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <p
            className="text-[11px] font-medium text-zinc-500"
            aria-live="polite"
          >
            {selectedDateLabel} · {filteredShows.length}{" "}
            {filteredShows.length === 1 ? "show" : "shows"}
          </p>
        </div>

        <div className="mt-4 border-t border-white/[0.06] pt-4">
          {filteredShows.length === 0 ? (
            totalShowsForDate > 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                  <SlidersHorizontal className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-white">
                  No shows match this filter
                </p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
                  {totalShowsForDate}{" "}
                  {totalShowsForDate === 1 ? "show is" : "shows are"} playing on{" "}
                  {selectedDateLabel}, just not in this time window.
                </p>
                <button
                  type="button"
                  onClick={() => setTimeFilter("all")}
                  className="mt-4 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-amber-400"
                >
                  Show all times
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                  <CalendarX2 className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-white">
                  No shows on {selectedDateLabel}
                </p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
                  {locationName ? `${locationName} has no shows on this date. ` : ""}
                  {nextAvailableDate
                    ? `The next available date is ${describeDate(
                        nextAvailableDate,
                      )}.`
                    : "New showtimes will appear here as soon as they are added. Try another date or check back soon."}
                </p>
                {nextAvailableDate ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(nextAvailableDate.key);
                      setTimeFilter("all");
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-amber-400"
                  >
                    <Ticket className="h-3.5 w-3.5" />
                    Show {describeDate(nextAvailableDate)}
                  </button>
                ) : (
                  <Link
                    href="/movies"
                    className="mt-4 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-accent/30 hover:text-accent"
                  >
                    Browse other movies
                  </Link>
                )}
              </div>
            )
          ) : (
            <div className="space-y-3">
              {theatreGroups.map((group) => (
                <article
                  key={group.id}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-accent/20 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-white sm:text-base">
                          {group.name}
                        </h3>
                        {group.location && (
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-500">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{group.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-accent">
                        {formatPrice(group.minPrice)}
                      </p>
                      <p className="text-[10px] text-zinc-500">onwards</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.shows.map((show) => {
                      const showTime = formatShowTime(show.show_time);

                      if (bookingClosedByShowId.get(show.id)) {
                        return (
                          <div
                            key={show.id}
                            role="group"
                            aria-label={`${showTime} show, bookings closed`}
                            title={BOOKING_CLOSED_MESSAGE}
                            className="flex min-w-[78px] cursor-not-allowed flex-col items-center rounded-xl border border-white/[0.05] bg-white/[0.015] px-3 py-2 opacity-70"
                          >
                            <span className="text-sm font-semibold text-zinc-500 line-through decoration-zinc-600/50">
                              {showTime}
                            </span>
                            <span className="mt-0.5 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.08em] text-rose-300/75">
                              <LockKeyhole className="h-2.5 w-2.5" />
                              Closed
                            </span>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={show.id}
                          href={`/book/${show.id}`}
                          className="group/time flex min-w-[78px] flex-col items-center rounded-xl border border-white/10 bg-black/30 px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/10 hover:shadow-[0_8px_24px_-12px_rgba(245,158,11,0.5)]"
                        >
                          <span className="text-sm font-semibold text-white transition-colors group-hover/time:text-accent">
                            {showTime}
                          </span>
                          <span className="mt-0.5 text-[10px] font-medium text-zinc-500 transition-colors group-hover/time:text-accent/80">
                            {formatPrice(show.price)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
