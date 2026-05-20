import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const { receipt, discount } = await req.json() as { receipt: string; discount?: number };
    if (!receipt) return NextResponse.json({ error: "Missing receipt" }, { status: 400 });
    const pct = typeof discount === "number" && discount > 0 && discount < 100 ? discount : 0;
    const amount = pct > 0 ? Math.round(99900 * (1 - pct / 100)) : undefined;
    const order = await createRazorpayOrder(receipt.slice(0, 40), amount);
    return NextResponse.json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
