import { createHmac, timingSafeEqual } from "crypto";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: string;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
}

interface RazorpayErrorPayload {
  error?: {
    description?: string;
    reason?: string;
  };
}

function errorMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as RazorpayErrorPayload).error === "object" &&
    (payload as RazorpayErrorPayload).error !== null
  ) {
    const apiError = (payload as RazorpayErrorPayload).error;
    return apiError?.description || apiError?.reason || fallback;
  }

  return fallback;
}

export function isRazorpayConfigured() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() &&
      process.env.RAZORPAY_KEY_SECRET?.trim(),
  );
}

export function getRazorpayConfig(): RazorpayConfig {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local.",
    );
  }

  return { keyId, keySecret };
}

function authorizationHeader(config: RazorpayConfig) {
  return `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`;
}

async function razorpayRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const config = getRazorpayConfig();
  const response = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: authorizationHeader(config),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as
    | T
    | RazorpayErrorPayload
    | null;

  if (!response.ok || !payload) {
    throw new Error(
      errorMessage(payload, "Razorpay could not process this request."),
    );
  }

  return payload as T;
}

export async function createRazorpayOrder(input: {
  amount: number;
  receipt: string;
  notes: Record<string, string>;
}) {
  return razorpayRequest<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amount,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
    }),
  });
}

export async function getRazorpayOrder(orderId: string) {
  return razorpayRequest<RazorpayOrder>(`/orders/${encodeURIComponent(orderId)}`);
}

export async function getRazorpayPayment(paymentId: string) {
  return razorpayRequest<RazorpayPayment>(
    `/payments/${encodeURIComponent(paymentId)}`,
  );
}

export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { keySecret } = getRazorpayConfig();
  const expected = createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(input.signature, "utf8");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}
