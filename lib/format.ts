import { getDateKeyInShowTimeZone } from "@/lib/show-time";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number | string) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? currencyFormatter.format(amount) : "—";
}

export function getTodayDateKey() {
  return getDateKeyInShowTimeZone();
}

export function formatShowDate(value: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export function formatShowTime(value: string) {
  if (!value) {
    return "—";
  }

  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toTimeInputValue(value: string) {
  return value ? value.slice(0, 5) : "";
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}
