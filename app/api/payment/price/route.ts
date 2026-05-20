import { NextRequest, NextResponse } from "next/server";
import { getToolPrice, type ToolKey } from "@/lib/db";

export async function GET(req: NextRequest) {
  const tool = (req.nextUrl.searchParams.get("tool") ?? "readiness") as ToolKey;
  const amountPaise = await getToolPrice(tool);
  const amountRupees = amountPaise / 100;
  return NextResponse.json({
    amountPaise,
    amountRupees,
    display: `₹${amountRupees.toLocaleString("en-IN")}`,
  });
}
