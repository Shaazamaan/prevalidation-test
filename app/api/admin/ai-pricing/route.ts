import { NextRequest, NextResponse } from "next/server";
import { isAdminServer } from "@/lib/admin-auth";
import {
  getAIFeaturePrice,
  setAIFeaturePrice,
  getPaymentGate,
  setPaymentGate,
  getAllToolPrices,
  setToolPrice,
  type PaymentGate,
  type ToolKey,
} from "@/lib/db";

export async function GET() {
  if (!isAdminServer()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [price, gate, toolPrices] = await Promise.all([
    getAIFeaturePrice(),
    getPaymentGate(),
    getAllToolPrices(),
  ]);
  return NextResponse.json({ price, gate, toolPrices });
}

export async function POST(req: NextRequest) {
  if (!isAdminServer()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as {
    price?: number;
    gate?: string;
    toolKey?: string;
    toolPrice?: number;
  };

  if (body.price !== undefined) {
    if (typeof body.price !== "number" || body.price < 1 || body.price > 100000) {
      return NextResponse.json({ error: "Price must be between ₹1 and ₹1,00,000" }, { status: 400 });
    }
    await setAIFeaturePrice(Math.round(body.price * 100));
  }

  if (body.gate !== undefined) {
    if (!["open", "early_access", "live"].includes(body.gate)) {
      return NextResponse.json({ error: "gate must be open | early_access | live" }, { status: 400 });
    }
    await setPaymentGate(body.gate as PaymentGate);
  }

  if (body.toolKey !== undefined && body.toolPrice !== undefined) {
    const validKeys: ToolKey[] = ["readiness", "advisor", "pitchdeck", "pitch_practice"];
    if (!validKeys.includes(body.toolKey as ToolKey)) {
      return NextResponse.json({ error: "Invalid tool key" }, { status: 400 });
    }
    if (typeof body.toolPrice !== "number" || body.toolPrice < 1 || body.toolPrice > 100000) {
      return NextResponse.json({ error: "Price must be between ₹1 and ₹1,00,000" }, { status: 400 });
    }
    await setToolPrice(body.toolKey as ToolKey, Math.round(body.toolPrice * 100));
  }

  return NextResponse.json({ ok: true });
}
