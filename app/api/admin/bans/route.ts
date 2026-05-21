import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getAllBans, banUser, unbanUser } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bans = await getAllBans();
  return NextResponse.json({ bans });
}

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { email?: string; reason?: string; durationHours?: number };
  if (!body.email || !body.reason?.trim()) {
    return NextResponse.json({ error: "email and reason required" }, { status: 400 });
  }

  await banUser(body.email.toLowerCase(), body.reason.trim(), body.durationHours);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await req.json() as { email?: string };
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  await unbanUser(email.toLowerCase());
  return NextResponse.json({ success: true });
}
