import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { getToolPrice, type ToolKey } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { receipt, discount, tool } = await req.json() as { receipt: string; discount?: number; tool?: string };
    if (!receipt) return NextResponse.json({ error: "Missing receipt" }, { status: 400 });
    const baseAmount = await getToolPrice((tool ?? "readiness") as ToolKey);
    const pct = typeof discount === "number" && discount > 0 && discount < 100 ? discount : 0;
    const amount = pct > 0 ? Math.round(baseAmount * (1 - pct / 100)) : baseAmount;
    const order = await createRazorpayOrder(receipt.slice(0, 40), amount);
    return NextResponse.json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
