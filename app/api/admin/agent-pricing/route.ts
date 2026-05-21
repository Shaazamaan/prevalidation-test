import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getAgentSubscriptionPrice, setAgentSubscriptionPrice, getAgentRazorpayPlanId, setAgentRazorpayPlanId } from "@/lib/db";
import { getRazorpayKeys } from "@/lib/razorpay";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [price, planId] = await Promise.all([getAgentSubscriptionPrice(), getAgentRazorpayPlanId()]);
  return NextResponse.json({ price, planId });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { action?: "set_price" | "create_plan"; amountRupees?: number };

  if (body.action === "set_price") {
    if (!body.amountRupees || body.amountRupees < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    await setAgentSubscriptionPrice(Math.round(body.amountRupees * 100));
    return NextResponse.json({ success: true, price: Math.round(body.amountRupees * 100) });
  }

  if (body.action === "create_plan") {
    try {
      const price = await getAgentSubscriptionPrice();
      const { keyId, keySecret, mode } = await getRazorpayKeys();
      if (mode !== "live") {
        return NextResponse.json({ error: "Switch to Live mode before creating a subscription plan." }, { status: 400 });
      }
      const res = await fetch("https://api.razorpay.com/v1/plans", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          period: "monthly",
          interval: 1,
          item: { name: "Devbridge Agent Subscription", amount: price, currency: "INR" },
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: { description?: string } };
        return NextResponse.json({ error: err?.error?.description ?? "Plan creation failed" }, { status: 500 });
      }
      const plan = await res.json() as { id: string };
      await setAgentRazorpayPlanId(plan.id);
      return NextResponse.json({ success: true, planId: plan.id });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
