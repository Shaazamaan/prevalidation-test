import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/db";
import { SYSTEM_PROMPT } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

type AIResult = { content: string | null; error?: string };

// Provider 1: Groq (llama-3.1-8b-instant — 131k TPM free tier)
async function callGroq(messages: { role: string; content: string }[]): Promise<AIResult> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        stream: false,
        max_tokens: 800,
        temperature: 0.4,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = data?.error?.message ?? `HTTP ${res.status}`;
      console.error("[Groq]", res.status, err);
      return { content: null, error: err };
    }
    return { content: data.choices?.[0]?.message?.content ?? null };
  } catch (e) {
    console.error("[Groq exception]", e);
    return { content: null, error: String(e) };
  }
}

// Provider 2: Gemini (gemini-pro — system prompt injected as first exchange)
async function callGemini(messages: { role: string; content: string }[]): Promise<AIResult> {
  try {
    const contents = [
      { role: "user", parts: [{ text: `Follow these instructions exactly:\n\n${SYSTEM_PROMPT}` }] },
      { role: "model", parts: [{ text: "Understood. I will act as the Pre-Validation Readiness Interrogator." }] },
      ...messages.slice(1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ];
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      const err = data?.error?.message ?? `HTTP ${res.status}`;
      console.error("[Gemini]", res.status, err);
      return { content: null, error: err };
    }
    return { content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? null };
  } catch (e) {
    console.error("[Gemini exception]", e);
    return { content: null, error: String(e) };
  }
}

// Provider 3: NVIDIA NIM (gpt-oss-120b via OpenAI-compatible endpoint)
async function callNvidia(messages: { role: string; content: string }[]): Promise<AIResult> {
  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages,
        stream: false,
        max_tokens: 800,
        temperature: 0.4,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = data?.error?.message ?? `HTTP ${res.status}`;
      console.error("[Nvidia]", res.status, err);
      return { content: null, error: err };
    }
    return { content: data.choices?.[0]?.message?.content ?? null };
  } catch (e) {
    console.error("[Nvidia exception]", e);
    return { content: null, error: String(e) };
  }
}

// Provider 4: OpenRouter (mistral-7b-instruct free)
async function callOpenRouter(messages: { role: string; content: string }[]): Promise<AIResult> {
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
        messages,
        stream: false,
        max_tokens: 800,
        temperature: 0.4,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = data?.error?.message ?? `HTTP ${res.status}`;
      console.error("[OpenRouter]", res.status, err);
      return { content: null, error: err };
    }
    return { content: data.choices?.[0]?.message?.content ?? null };
  } catch (e) {
    console.error("[OpenRouter exception]", e);
    return { content: null, error: String(e) };
  }
}

async function getAIResponse(messages: { role: string; content: string }[]): Promise<string | null> {
  const providers = [callGroq, callGemini, callNvidia, callOpenRouter];
  for (const provider of providers) {
    const result = await provider(messages);
    if (result.content) return result.content;
    console.log(`[AI] Provider failed (${result.error}), trying next...`);
  }
  return null;
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { sessionId, message } = await req.json();
    if (!sessionId || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status === "completed") {
      return NextResponse.json({ error: "Session completed" }, { status: 403 });
    }
    if (session.messages.length >= 60) {
      return NextResponse.json({ error: "Session limit reached" }, { status: 429 });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...session.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const content = await getAIResponse(messages);
    const encoder = new TextEncoder();

    if (!content) {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: "All AI providers are temporarily unavailable. Please wait 30 seconds and try again." })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return new NextResponse(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    await updateSession(sessionId, {
      messages: [
        ...session.messages,
        { role: "user" as const, content: message, timestamp: Date.now() },
        { role: "assistant" as const, content, timestamp: Date.now() },
      ],
    });

    // Stream word by word for live feel
    const words = content.split(" ");
    const stream = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < words.length; i++) {
          const token = i === 0 ? words[i] : " " + words[i];
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
