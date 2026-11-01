export const MAX_SEATS_PER_BOOKING = 10;
export const SEAT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
export const SEATS_PER_ROW = 12;

export const SEAT_CATEGORIES = [
  {
    id: "executive",
    name: "Executive",
    rows: ["H", "G"],
    priceMultiplier: 1.5,
    description: "Recliner comfort at the back",
  },
  {
    id: "premium",
    name: "Premium",
    rows: ["F", "E", "D"],
    priceMultiplier: 1.25,
    description: "Centre rows with the best view",
  },
  {
    id: "normal",
    name: "Normal",
    rows: ["C", "B", "A"],
    priceMultiplier: 1,
    description: "Front rows at a great value",
  },
] as const;

export type SeatCategory = (typeof SEAT_CATEGORIES)[number];

const seatPattern = /^[A-H](?:[1-9]|1[0-2])$/;
const bestSeatRows = new Set(["D", "E", "F"]);

export function getSeatCategory(seat: string): SeatCategory {
  const row = seat.trim().charAt(0).toUpperCase();

  return (
    SEAT_CATEGORIES.find((category) =>
      (category.rows as readonly string[]).includes(row),
    ) ?? SEAT_CATEGORIES[SEAT_CATEGORIES.length - 1]
  );
}

export function getCategoryPrice(
  basePrice: number,
  category: SeatCategory,
) {
  return Math.round(basePrice * category.priceMultiplier);
}

export function getSeatPrice(basePrice: number, seat: string) {
  return getCategoryPrice(basePrice, getSeatCategory(seat));
}

export function calculateSeatTotal(basePrice: number, seats: string[]) {
  return seats.reduce(
    (total, seat) => total + getSeatPrice(basePrice, seat),
    0,
  );
}

export function isBestSeat(seat: string) {
  const match = /^([A-Z])(\d+)$/.exec(seat.trim().toUpperCase());

  if (!match) {
    return false;
  }

  const seatNumber = Number(match[2]);

  return (
    bestSeatRows.has(match[1]) &&
    seatNumber >= 4 &&
    seatNumber <= 9
  );
}

export function normalizeSeatIds(value: unknown) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > MAX_SEATS_PER_BOOKING
  ) {
    return null;
  }

  const seats: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return null;
    }

    const seat = item.trim().toUpperCase();

    if (!seatPattern.test(seat)) {
      return null;
    }

    seats.push(seat);
  }

  const uniqueSeats = Array.from(new Set(seats));

  if (uniqueSeats.length !== seats.length) {
    return null;
  }

  return uniqueSeats.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}
