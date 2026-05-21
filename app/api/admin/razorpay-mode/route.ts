import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getRazorpayMode, setRazorpayMode } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mode = await getRazorpayMode();
  return NextResponse.json({ mode });
}

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { mode } = await req.json() as { mode?: string };
  if (mode !== "test" && mode !== "live") {
    return NextResponse.json({ error: "Invalid mode. Must be 'test' or 'live'." }, { status: 400 });
  }
  await setRazorpayMode(mode);
  return NextResponse.json({ mode });
}
