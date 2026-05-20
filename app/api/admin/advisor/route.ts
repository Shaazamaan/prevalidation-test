import { NextRequest, NextResponse } from "next/server";
import { getAllAdvisorSessions, deleteAdvisorSession, updateAdvisorNotes } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await getAllAdvisorSessions();
  return NextResponse.json({ sessions });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await deleteAdvisorSession(id);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, adminNotes } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await updateAdvisorNotes(id, adminNotes ?? "");
  return NextResponse.json({ success: true });
}
