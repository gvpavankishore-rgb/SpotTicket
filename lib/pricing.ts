export const BOOKING_CHARGE_AMOUNT = 20;
export const IGST_RATE = 0.18;

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateBookingCharges() {
  const bookingCharge = BOOKING_CHARGE_AMOUNT;
  const igst = roundMoney(bookingCharge * IGST_RATE);
  const total = roundMoney(bookingCharge + igst);
  return { bookingCharge, igst, total };
}
