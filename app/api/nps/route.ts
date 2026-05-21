import { NextRequest, NextResponse } from "next/server";
import { saveNPS, markNPSSubmitted, getAllNPS, type NPSEntry } from "@/lib/db";
import { isAdminServer } from "@/lib/admin-auth";

export async function GET() {
  if (!isAdminServer()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entries = await getAllNPS();
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    score?: number;
    comment?: string;
    tool?: string;
    email?: string;
  };

  if (body.score === undefined || body.score < 0 || body.score > 10) {
    return NextResponse.json({ error: "score must be 0–10" }, { status: 400 });
  }
  if (!body.tool) {
    return NextResponse.json({ error: "tool required" }, { status: 400 });
  }

  const entry: NPSEntry = {
    score: body.score,
    tool: body.tool,
    submittedAt: Date.now(),
    ...(body.comment?.trim() ? { comment: body.comment.trim() } : {}),
    ...(body.email ? { email: body.email.toLowerCase() } : {}),
  };

  await saveNPS(entry);

  if (body.email) {
    await markNPSSubmitted(body.email, body.tool);
  }

  return NextResponse.json({ ok: true });
}
