import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession, saveReport } from "@/lib/db";
import { buildEvaluationPrompt } from "@/lib/evaluate-prompt";
import type { Report } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

type AIResult = { content: string | null; error?: string };

async function callGroq(prompt: string): Promise<AIResult> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_tokens: 1200,
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { content: null, error: data?.error?.message ?? `HTTP ${res.status}` };
    return { content: data.choices?.[0]?.message?.content ?? null };
  } catch (e) {
    return { content: null, error: String(e) };
  }
}

async function callNvidia(prompt: string): Promise<AIResult> {
  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_tokens: 1200,
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { content: null, error: data?.error?.message ?? `HTTP ${res.status}` };
    return { content: data.choices?.[0]?.message?.content ?? null };
  } catch (e) {
    return { content: null, error: String(e) };
  }
}

async function callGemini(prompt: string): Promise<AIResult> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1200 },
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) return { content: null, error: data?.error?.message ?? `HTTP ${res.status}` };
    return { content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? null };
  } catch (e) {
    return { content: null, error: String(e) };
  }
}

async function callOpenRouter(prompt: string): Promise<AIResult> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
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
        max_tokens: 1200,
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { content: null, error: data?.error?.message ?? `HTTP ${res.status}` };
    return { content: data.choices?.[0]?.message?.content ?? null };
  } catch (e) {
    return { content: null, error: String(e) };
  }
}

async function getAIResponse(prompt: string): Promise<string | null> {
  const providers = [callGroq, callNvidia, callGemini, callOpenRouter];
  for (const provider of providers) {
    const result = await provider(prompt);
    if (result.content) return result.content;
    console.log(`[Evaluate] Provider failed (${result.error}), trying next...`);
  }
  return null;
}

function extractReport(text: string): Report | null {
  const match = /<REPORT>([\s\S]*?)<\/REPORT>/.exec(text);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim()) as Report;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, answers } = await req.json() as {
      sessionId: string;
      answers: { question: string; answer: string }[];
    };

    if (!sessionId || !answers?.length) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status === "completed") {
      return NextResponse.json({ error: "Already completed" }, { status: 403 });
    }

    const prompt = buildEvaluationPrompt(session.founderName, session.startupIdea, answers);
    const content = await getAIResponse(prompt);

    if (!content) {
      return NextResponse.json({ error: "All AI providers unavailable. Please try again in 30 seconds." }, { status: 503 });
    }

    const report = extractReport(content);
    if (!report) {
      console.error("[Evaluate] Could not parse REPORT from AI response:", content.slice(0, 500));
      return NextResponse.json({ error: "Failed to parse evaluation. Please try again." }, { status: 500 });
    }

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
