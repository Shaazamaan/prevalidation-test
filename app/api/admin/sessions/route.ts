import { NextRequest, NextResponse } from "next/server";
import { getAllSessions, deleteSession } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = 20;
  const all = await getAllSessions();
  const total = all.length;
  const sessions = all.slice((page - 1) * limit, page * limit);
  return NextResponse.json({ sessions, total, page, limit });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await deleteSession(id);
  return NextResponse.json({ success: true });
}
