import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession, saveReport } from "@/lib/db";
import { buildEvaluationPrompt } from "@/lib/evaluate-prompt";
import type { Report } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

type AIResult = { content: string | null; error?: string };

const TIMEOUT = 20000;

async function callGroq(prompt: string): Promise<AIResult> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { content: null, error: `Groq ${res.status}: ${data?.error?.message}` };
    return { content: data.choices?.[0]?.message?.content ?? null };
  } catch (e) {
    return { content: null, error: `Groq exception: ${String(e)}` };
  }
}

async function callGemini(prompt: string): Promise<AIResult> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(TIMEOUT),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 3000 },
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) return { content: null, error: `Gemini ${res.status}: ${data?.error?.message}` };
    return { content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? null };
  } catch (e) {
    return { content: null, error: `Gemini exception: ${String(e)}` };
  }
}

async function callNvidia(prompt: string): Promise<AIResult> {
  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { content: null, error: `Nvidia ${res.status}: ${data?.error?.message}` };
    return { content: data.choices?.[0]?.message?.content ?? null };
  } catch (e) {
    return { content: null, error: `Nvidia exception: ${String(e)}` };
  }
}

async function callOpenRouter(prompt: string): Promise<AIResult> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL ?? "https://prevalidation-test.vercel.app",
        "X-Title": "Founder Readiness Check",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { content: null, error: `OpenRouter ${res.status}: ${data?.error?.message}` };
    return { content: data.choices?.[0]?.message?.content ?? null };
  } catch (e) {
    return { content: null, error: `OpenRouter exception: ${String(e)}` };
  }
}

async function raceFirst(fns: (() => Promise<AIResult>)[]): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = 0;
    const total = fns.length;
    if (total === 0) { resolve(null); return; }
    fns.forEach((fn) => {
      fn()
        .then((result) => {
          settled++;
          if (result.content) {
            resolve(result.content);
          } else {
            console.error(`[Evaluate] Provider failed: ${result.error}`);
            if (settled === total) resolve(null);
          }
        })
        .catch((err) => {
          settled++;
          console.error(`[Evaluate] Provider threw: ${String(err)}`);
          if (settled === total) resolve(null);
        });
    });
  });
}

async function getAIResponse(prompt: string): Promise<string | null> {
  // Try Groq + Gemini in parallel first (highest capacity/quality)
  const first = await raceFirst([
    () => callGroq(prompt),
    () => callGemini(prompt),
  ]);
  if (first) return first;

  // Fallback: NVIDIA + OpenRouter in parallel
  const second = await raceFirst([
    () => callNvidia(prompt),
    () => callOpenRouter(prompt),
  ]);
  return second;
}

function extractReport(text: string): Report | null {
  const match = /<REPORT>([\s\S]*?)<\/REPORT>/.exec(text);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim()) as Report;
    // Validate required fields exist
    if (!parsed.verdict || !parsed.finalSummary) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isReportComplete(report: Report): boolean {
  return (
    ["READY", "CONDITIONALLY READY", "NOT READY"].includes(report.verdict) &&
    typeof report.realityScore === "number" &&
    Array.isArray(report.phaseScores) &&
    report.phaseScores.length > 0 &&
    Array.isArray(report.mustResolveBeforeValidation) &&
    report.mustResolveBeforeValidation.length > 0 &&
    typeof report.finalSummary === "string" &&
    report.finalSummary.length > 10
  );
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, answers } = await req.json() as {
      sessionId: string;
      answers: { question: string; answer: string; phase?: number }[];
    };

    if (!sessionId || !answers?.length) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status === "completed") {
      return NextResponse.json({ error: "Already completed" }, { status: 403 });
    }

    const prompt = buildEvaluationPrompt(
      session.founderName,
      session.startupIdea,
      answers,
      session.startupType
    );
    const content = await getAIResponse(prompt);

    if (!content) {
      return NextResponse.json(
        { error: "All AI providers unavailable. Please try again in 30 seconds." },
        { status: 503 }
      );
    }

    const report = extractReport(content);
    if (!report) {
      console.error("[Evaluate] Could not parse REPORT. Raw:", content.slice(0, 800));
      return NextResponse.json(
        { error: "Failed to parse evaluation. Please try again." },
        { status: 500 }
      );
    }

    if (!isReportComplete(report)) {
      console.error("[Evaluate] Report incomplete:", JSON.stringify(report).slice(0, 400));
      return NextResponse.json(
        { error: "Evaluation incomplete. Please try again." },
        { status: 500 }
      );
    }

    // Ensure arrays that may be missing are initialised
    report.contradictions = report.contradictions ?? [];
    report.nextSteps = report.nextSteps ?? [];
    report.phaseScores = report.phaseScores ?? [];

    const messages = answers.flatMap((a, i) => [
      { role: "assistant" as const, content: `Q${i + 1}: ${a.question}`, timestamp: Date.now() },
      { role: "user" as const, content: a.answer, timestamp: Date.now() },
    ]);

    await Promise.all([
      saveReport(sessionId, report),
      updateSession(sessionId, { status: "completed", messages }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Evaluate] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
