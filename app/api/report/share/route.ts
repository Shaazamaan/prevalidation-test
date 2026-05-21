import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSession, getReport, createShareToken } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to share reports" }, { status: 401 });
  }

  const { sessionId } = await req.json() as { sessionId?: string };
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const s = await getSession(sessionId);
  if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (s.email?.toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json({ error: "Not your session" }, { status: 403 });
  }

  const report = await getReport(sessionId);
  if (!report) return NextResponse.json({ error: "Report not found — complete evaluation first" }, { status: 404 });

  const token = await createShareToken(sessionId, s.founderName, s.startupIdea, s.email ?? "");
  return NextResponse.json({ token, url: `/scorecard/${token}` });
}
