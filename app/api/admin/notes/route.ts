import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId, notes } = await req.json() as { sessionId: string; notes: string };
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  await updateSession(sessionId, { adminNotes: notes ?? "" });
  return NextResponse.json({ success: true });
}
