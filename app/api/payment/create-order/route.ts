import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { getToolPrice, getPaymentGate, checkRateLimit, hashIP, type ToolKey } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown";
    const ipHash = await hashIP(ip);
    const allowed = await checkRateLimit("create-order", ipHash, 20, 3600);
    if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const { receipt, discount, tool } = await req.json() as { receipt: string; discount?: number; tool?: string };
    if (!receipt) return NextResponse.json({ error: "Missing receipt" }, { status: 400 });

    const gate = await getPaymentGate();
    if (gate === "open") {
      return NextResponse.json({ orderId: "GATE_OPEN", amount: 0, free: true });
    }
    if (gate === "early_access") {
      return NextResponse.json({ error: "We're in early access — payments aren't open yet. Please check back soon." }, { status: 403 });
    }

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
