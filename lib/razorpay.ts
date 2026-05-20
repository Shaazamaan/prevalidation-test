import crypto from "crypto";

const AMOUNT = 99900; // ₹999 in paise

// Set PAYMENT_MODE=live in env to switch to live keys
const mode = process.env.PAYMENT_MODE === "live" ? "live" : "test";

const KEY_ID =
  mode === "live"
    ? (process.env.RAZORPAY_LIVE_KEY_ID ?? process.env.RAZORPAY_KEY_ID!)
    : process.env.RAZORPAY_KEY_ID!;

const KEY_SECRET =
  mode === "live"
    ? (process.env.RAZORPAY_LIVE_KEY_SECRET ?? process.env.RAZORPAY_KEY_SECRET!)
    : process.env.RAZORPAY_KEY_SECRET!;

export const RAZORPAY_KEY_ID = KEY_ID;
export const PAYMENT_MODE = mode;

export async function createRazorpayOrder(receipt: string): Promise<{ id: string; amount: number }> {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: AMOUNT, currency: "INR", receipt }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Razorpay order failed: ${JSON.stringify(err)}`);
  }
  return res.json();
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
