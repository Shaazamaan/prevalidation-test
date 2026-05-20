import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const { receipt } = await req.json() as { receipt: string };
    if (!receipt) return NextResponse.json({ error: "Missing receipt" }, { status: 400 });
    const order = await createRazorpayOrder(receipt.slice(0, 40));
    return NextResponse.json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
