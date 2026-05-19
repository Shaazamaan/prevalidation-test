import { NextRequest, NextResponse } from "next/server";
import { getAllSessions } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = 20;

  const all = await getAllSessions();
  const total = all.length;
  const sessions = all.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ sessions, total, page, limit });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const { deleteSession } = await import("@/lib/db");
  await deleteSession(id);
  return NextResponse.json({ success: true });
}
