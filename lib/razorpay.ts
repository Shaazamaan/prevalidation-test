import crypto from "crypto";
import { getRazorpayMode } from "@/lib/db";

export async function getRazorpayKeys(): Promise<{ keyId: string; keySecret: string; mode: "test" | "live" }> {
  const mode = await getRazorpayMode();
  const keyId =
    mode === "live"
      ? (process.env.RAZORPAY_LIVE_KEY_ID ?? process.env.RAZORPAY_KEY_ID!)
      : process.env.RAZORPAY_KEY_ID!;
  const keySecret =
    mode === "live"
      ? (process.env.RAZORPAY_LIVE_KEY_SECRET ?? process.env.RAZORPAY_KEY_SECRET!)
      : process.env.RAZORPAY_KEY_SECRET!;
  return { keyId, keySecret, mode };
}

export async function createRazorpayOrder(receipt: string, amount: number): Promise<{ id: string; amount: number }> {
  const { keyId, keySecret } = await getRazorpayKeys();
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, currency: "INR", receipt }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Razorpay order failed: ${JSON.stringify(err)}`);
  }
  return res.json();
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret?: string
): boolean {
  const secret = keySecret ?? process.env.RAZORPAY_KEY_SECRET!;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

// Static exports for backward compat (config route, PaymentModal prefetch)
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
export const PAYMENT_MODE: "test" | "live" =
  process.env.PAYMENT_MODE === "live" ? "live" : "test";
