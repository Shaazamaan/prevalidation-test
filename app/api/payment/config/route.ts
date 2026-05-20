import { NextResponse } from "next/server";
import { getRazorpayKeys } from "@/lib/razorpay";

export async function GET() {
  const { keyId, mode } = await getRazorpayKeys();
  return NextResponse.json({ keyId, mode });
}
