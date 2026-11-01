interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    escape?: boolean;
    backdropclose?: boolean;
    ondismiss?: () => void;
  };
  handler?: (response: RazorpayPaymentResponse) => void | Promise<void>;
}

interface RazorpayInstance {
  open(): void;
  close(): void;
  on(event: "payment.failed", handler: (response: RazorpayFailureResponse) => void): void;
}

interface Window {
  Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
}
