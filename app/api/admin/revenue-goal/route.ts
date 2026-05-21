import { NextRequest, NextResponse } from "next/server";
import { isAdminServer } from "@/lib/admin-auth";
import { getRevenueGoal, setRevenueGoal } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!await isAdminServer()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const month = req.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const goal = await getRevenueGoal(month);
  return NextResponse.json({ month, goal });
}

export async function POST(req: NextRequest) {
  if (!await isAdminServer()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as { month?: string; goal?: number; amountPaise?: number };
  const month = body.month ?? new Date().toISOString().slice(0, 7);
  const amountPaise = body.goal ?? body.amountPaise;
  if (typeof amountPaise !== "number" || amountPaise < 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  await setRevenueGoal(month, amountPaise);
  return NextResponse.json({ success: true, month, goal: amountPaise });
}
