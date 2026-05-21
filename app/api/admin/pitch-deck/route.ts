import { NextRequest, NextResponse } from "next/server";
import { getAllPitchDeckSessions, deletePitchDeckSession, updatePitchDeckNotes } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await getAllPitchDeckSessions();
  return NextResponse.json({ sessions });
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await deletePitchDeckSession(id);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, adminNotes } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await updatePitchDeckNotes(id, adminNotes ?? "");
  return NextResponse.json({ success: true });
}
