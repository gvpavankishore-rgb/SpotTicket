export const SHOW_TIME_ZONE = "Asia/Kolkata";
export const BOOKING_CUTOFF_MINUTES = 15;
export const BOOKING_CLOSED_MESSAGE =
  "Bookings are closed for this show. Tickets close 15 minutes before showtime.";

const zonedDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: SHOW_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

interface ZonedDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface ShowBookingStatus {
  startsAtMs: number | null;
  cutoffAtMs: number | null;
  minutesUntilStart: number | null;
  isClosed: boolean;
}

function getZonedDateTimeParts(date: Date): ZonedDateTimeParts | null {
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const values: Record<string, string> = {};

  for (const part of zonedDateTimeFormatter.formatToParts(date)) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  const parts = {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };

  return Object.values(parts).every(Number.isFinite) ? parts : null;
}

function getZonedWallClockMs(date: Date) {
  const parts = getZonedDateTimeParts(date);

  return parts
    ? Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
      )
    : null;
}

export function getDateKeyInShowTimeZone(date = new Date()) {
  const parts = getZonedDateTimeParts(date);

  if (!parts) {
    return "";
  }

  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(
    2,
    "0",
  )}-${String(parts.day).padStart(2, "0")}`;
}

export function getShowStartMs(showDate: string, showTime: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(showDate.trim());
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(showTime.trim());

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] ?? 0);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }

  const startsAtMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const check = new Date(startsAtMs);

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  return startsAtMs;
}

export function getShowBookingStatus(
  showDate: string,
  showTime: string,
  now = new Date(),
): ShowBookingStatus {
  const startsAtMs = getShowStartMs(showDate, showTime);
  const nowMs = getZonedWallClockMs(now);

  if (startsAtMs === null || nowMs === null) {
    return {
      startsAtMs: null,
      cutoffAtMs: null,
      minutesUntilStart: null,
      isClosed: false,
    };
  }

  const cutoffAtMs = startsAtMs - BOOKING_CUTOFF_MINUTES * 60 * 1000;

  return {
    startsAtMs,
    cutoffAtMs,
    minutesUntilStart: Math.ceil((startsAtMs - nowMs) / (60 * 1000)),
    isClosed: nowMs >= cutoffAtMs,
  };
}

export function isShowBookingClosed(
  showDate: string,
  showTime: string,
  now = new Date(),
) {
  return getShowBookingStatus(showDate, showTime, now).isClosed;
}
