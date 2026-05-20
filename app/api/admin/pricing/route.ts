import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getAllToolPrices, setToolPrice, type ToolKey } from "@/lib/db";

const VALID_TOOLS: ToolKey[] = ["readiness", "advisor", "pitchdeck"];

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prices = await getAllToolPrices();
  return NextResponse.json(prices);
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tool, amountRupees } = await req.json() as { tool: string; amountRupees: number };

  if (!VALID_TOOLS.includes(tool as ToolKey)) {
    return NextResponse.json({ error: "Invalid tool" }, { status: 400 });
  }
  if (typeof amountRupees !== "number" || amountRupees < 1 || amountRupees > 100000) {
    return NextResponse.json({ error: "Amount must be between ₹1 and ₹1,00,000" }, { status: 400 });
  }

  const amountPaise = Math.round(amountRupees * 100);
  await setToolPrice(tool as ToolKey, amountPaise);
  return NextResponse.json({ success: true, tool, amountPaise, amountRupees });
}
