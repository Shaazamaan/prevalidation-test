import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getPitchPracticeSession,
  savePitchPracticeSession,
  incrementPitchPracticeCount,
  type PitchPracticeScore,
} from "@/lib/db";

export const runtime = "nodejs";
const TIMEOUT = 25000;

async function scoreWithClaude(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text ?? null;
  } catch { return null; }
}

async function scoreWithGroq(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
        stream: false,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

function parseScore(text: string): PitchPracticeScore | null {
  const match = /\{[\s\S]*\}/.exec(text);
  if (!match) return null;
  try { return JSON.parse(match[0]) as PitchPracticeScore; } catch { return null; }
}

async function generateScore(
  founderName: string,
  startupName: string,
  oneLiner: string,
  exchanges: { question: string; answer: string }[],
  useClaude: boolean
): Promise<PitchPracticeScore | null> {
  const transcript = exchanges
    .map((e, i) => `Q${i + 1}: ${e.question}\nA${i + 1}: ${e.answer || "(no answer)"}`)
    .join("\n\n");

  const prompt = `You evaluated a startup pitch. Score this pitch practice session.

Startup: ${startupName}
Pitch: ${oneLiner}
Founder: ${founderName}

${transcript}

Return ONLY valid JSON in this exact format:
{
  "overall": <integer 1-10>,
  "strongestMoment": "<one sentence — what they said best>",
  "weakestMoment": "<one sentence — their biggest gap>",
  "improvements": ["<specific action 1>", "<specific action 2>", "<specific action 3>"],
  "verdict": "<2-3 sentence honest assessment of their pitch readiness>"
}`;

  const raw = useClaude
    ? (await scoreWithClaude(prompt) ?? await scoreWithGroq(prompt))
    : (await scoreWithGroq(prompt));

  return raw ? parseScore(raw) : null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, lastAnswer } = await req.json() as { sessionId: string; lastAnswer?: string };
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const ppSession = await getPitchPracticeSession(sessionId);
  if (!ppSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (ppSession.email !== session.user.email.toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (ppSession.completedAt) {
    return NextResponse.json({ score: ppSession.score });
  }

  if (lastAnswer?.trim() && ppSession.exchanges.length > 0) {
    ppSession.exchanges[ppSession.exchanges.length - 1].answer = lastAnswer.trim();
  }

  const isPaid = ppSession.payment !== null && !ppSession.payment.isFree;
  const score = await generateScore(
    ppSession.founderName,
    ppSession.startupName,
    ppSession.oneLiner,
    ppSession.exchanges,
    isPaid
  );

  ppSession.score = score;
  ppSession.completedAt = Date.now();
  await savePitchPracticeSession(ppSession);
  await incrementPitchPracticeCount(ppSession.email);

  return NextResponse.json({ score, sessionId });
}
