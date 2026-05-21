import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPitchPracticeSession, savePitchPracticeSession } from "@/lib/db";

export const runtime = "nodejs";

const MAX_QUESTIONS = 10;
const TIMEOUT = 20000;

const INVESTOR_LABELS: Record<string, string> = {
  angel: "Indian angel investor (HNI, writing ₹10–50L cheques)",
  seed_vc: "seed-stage VC (Indian fund, writing ₹50L–2Cr cheques)",
  series_a_vc: "Series A VC (pan-India fund, writing ₹5–20Cr cheques)",
};

function buildSystemPrompt(
  founderName: string,
  startupName: string,
  oneLiner: string,
  investorType: string,
  questionNumber: number
): string {
  return `You are a sharp, experienced ${INVESTOR_LABELS[investorType] ?? "investor"} evaluating a pitch. You are skeptical but fair — your job is to stress-test the founder's thinking.

Founder: ${founderName}
Startup: ${startupName}
Pitch: ${oneLiner}

Rules:
- Ask exactly ONE question per response. Nothing else.
- Be direct, adversarial, and specific. No filler. No compliments unless earned.
- Rotate focus: market size, competition, business model, traction, team, unit economics, "why now", "why you".
- Keep your question under 40 words.
- This is question ${questionNumber} of ${MAX_QUESTIONS}. ${questionNumber === 1 ? "Open with a brief 1-sentence greeting, then ask your first hard question." : "Acknowledge the answer in max one sentence, then ask the next question."}
- Never summarise or score — that happens separately after all ${MAX_QUESTIONS} questions.`;
}

async function callClaude(messages: { role: string; content: string }[], systemPrompt: string): Promise<string | null> {
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
        max_tokens: 150,
        system: systemPrompt,
        messages,
        temperature: 0.7,
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

async function callGroq(messages: { role: string; content: string }[], systemPrompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 120,
        temperature: 0.7,
        stream: false,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function callGemini(messages: { role: string; content: string }[], systemPrompt: string): Promise<string | null> {
  try {
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(TIMEOUT),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 120 },
        }),
      }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, answer } = await req.json() as { sessionId: string; answer: string };
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const ppSession = await getPitchPracticeSession(sessionId);
  if (!ppSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (ppSession.email !== session.user.email.toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (ppSession.completedAt) {
    return NextResponse.json({ error: "Session already completed" }, { status: 400 });
  }

  const questionNumber = ppSession.exchanges.length + 1;

  // Save the answer for the previous exchange (if any)
  if (answer?.trim() && ppSession.exchanges.length > 0) {
    const last = ppSession.exchanges[ppSession.exchanges.length - 1];
    if (!last.answer) last.answer = answer.trim();
  }

  if (ppSession.exchanges.length >= MAX_QUESTIONS) {
    await savePitchPracticeSession(ppSession);
    return NextResponse.json({ done: true, sessionId });
  }

  const systemPrompt = buildSystemPrompt(
    ppSession.founderName,
    ppSession.startupName,
    ppSession.oneLiner,
    ppSession.investorType,
    questionNumber
  );

  // Send only last 4 exchanges as context to keep tokens low
  const contextExchanges = ppSession.exchanges.slice(-4);
  const messages: { role: string; content: string }[] = [];
  for (const ex of contextExchanges) {
    messages.push({ role: "assistant", content: ex.question });
    if (ex.answer) messages.push({ role: "user", content: ex.answer });
  }
  if (answer?.trim() && ppSession.exchanges.length === 0) {
    // First answer before any question — shouldn't happen, but guard
  }

  const isPaid = ppSession.payment !== null && !ppSession.payment.isFree;
  const question = isPaid
    ? (await callClaude(messages, systemPrompt) ?? await callGroq(messages, systemPrompt) ?? await callGemini(messages, systemPrompt))
    : (await callGroq(messages, systemPrompt) ?? await callGemini(messages, systemPrompt));
  if (!question) return NextResponse.json({ error: "AI unavailable, try again" }, { status: 503 });

  ppSession.exchanges.push({ question: question.trim(), answer: "" });
  await savePitchPracticeSession(ppSession);

  const done = ppSession.exchanges.length >= MAX_QUESTIONS;
  return NextResponse.json({ question: question.trim(), questionNumber, done, sessionId });
}
