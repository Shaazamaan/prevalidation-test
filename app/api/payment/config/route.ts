import { NextResponse } from "next/server";
import { RAZORPAY_KEY_ID, PAYMENT_MODE } from "@/lib/razorpay";

export function GET() {
  return NextResponse.json({ keyId: RAZORPAY_KEY_ID, mode: PAYMENT_MODE });
}
