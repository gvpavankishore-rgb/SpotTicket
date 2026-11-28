export const SEAT_HOLD_MINUTES = 8;
export const SEAT_HOLD_MS = SEAT_HOLD_MINUTES * 60 * 1000;

export function getSeatHoldStorageKey(showId: string) {
  return `spotticket:hold:${showId}`;
}

export interface StoredSeatHold {
  holdId: string;
  showId: string;
  seats: string[];
  snacks: { id: string; quantity: number }[];
  expiresAt: string;
}
