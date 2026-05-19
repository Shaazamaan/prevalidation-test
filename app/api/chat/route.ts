import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/db";
import { SYSTEM_PROMPT } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

async function callGroq(messages: { role: string; content: string }[]): Promise<{ content: string | null; error?: string }> {
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
      const errMsg = data?.error?.message ?? `HTTP ${res.status}`;
      console.error("Groq error:", res.status, errMsg);
      return { content: null, error: `Groq ${res.status}: ${errMsg}` };
    }
    return { content: data.choices?.[0]?.message?.content ?? null };
  } catch (e) {
    console.error("Groq exception:", e);
    return { content: null, error: String(e) };
  }
}

async function callGemini(messages: { role: string; content: string }[]): Promise<{ content: string | null; error?: string }> {
  try {
    // gemini-pro: inject system prompt as first user/model exchange
    const contents = [
      { role: "user", parts: [{ text: `You must follow these instructions exactly:\n\n${SYSTEM_PROMPT}` }] },
      { role: "model", parts: [{ text: "Understood. I will act as the Pre-Validation Readiness Interrogator as instructed." }] },
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
      const errMsg = data?.error?.message ?? `HTTP ${res.status}`;
      console.error("Gemini error:", res.status, errMsg);
      return { content: null, error: `Gemini ${res.status}: ${errMsg}` };
    }
    return { content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? null };
  } catch (e) {
    console.error("Gemini exception:", e);
    return { content: null, error: String(e) };
  }
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

    const groqMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...session.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    // Try Groq first, then Gemini
    let result = await callGroq(groqMessages);
    if (!result.content) {
      console.log("Groq failed, trying Gemini. Error:", result.error);
      result = await callGemini(groqMessages);
    }

    const encoder = new TextEncoder();

    if (!result.content) {
      const errText = `[Both AI providers failed. Groq/Gemini error logged server-side. Please try again in a moment.]`;
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: errText })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return new NextResponse(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    const userMessage = { role: "user" as const, content: message, timestamp: Date.now() };
    const assistantMessage = { role: "assistant" as const, content: result.content, timestamp: Date.now() };

    await updateSession(sessionId, {
      messages: [...session.messages, userMessage, assistantMessage],
    });

    // Stream word by word for live feel
    const words = result.content.split(" ");
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
