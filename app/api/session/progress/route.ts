import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const { sessionId, phase } = await req.json() as { sessionId: string; phase: number };
    if (!sessionId || typeof phase !== "number") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status === "completed") return NextResponse.json({ success: true });

    await updateSession(sessionId, { lastActivePhase: phase });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Progress] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
