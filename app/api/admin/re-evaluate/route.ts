import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await req.json() as { sessionId: string };
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  // Reset to active so evaluate endpoint accepts it again
  await updateSession(sessionId, { status: "active" });

  const answers: { question: string; answer: string }[] = [];
  for (let i = 0; i < session.messages.length - 1; i += 2) {
    const q = session.messages[i];
    const a = session.messages[i + 1];
    if (q?.role === "assistant" && a?.role === "user") {
      const questionText = q.content.includes(":") ? q.content.slice(q.content.indexOf(":") + 1).trim() : q.content;
      answers.push({ question: questionText, answer: a.content });
    }
  }

  if (!answers.length) {
    await updateSession(sessionId, { status: "completed" });
    return NextResponse.json({ error: "No answers found to re-evaluate" }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://prevalidation-test.vercel.app";
  const evalRes = await fetch(`${baseUrl}/api/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, answers }),
  });

  const data = await evalRes.json();
  if (!evalRes.ok) {
    await updateSession(sessionId, { status: "completed" });
    return NextResponse.json({ error: data.error ?? "Re-evaluation failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
