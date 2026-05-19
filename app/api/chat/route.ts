import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/db";
import { SYSTEM_PROMPT } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

async function callGroq(messages: { role: string; content: string }[]): Promise<string | null> {
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
        max_tokens: 1024,
        temperature: 0.4,
      }),
    });
    if (!res.ok) {
      console.error("Groq error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error("Groq exception:", e);
    return null;
  }
}

async function callGemini(
  contents: { role: string; parts: { text: string }[] }[]
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
        }),
      }
    );
    if (!res.ok) {
      console.error("Gemini error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (e) {
    console.error("Gemini exception:", e);
    return null;
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

    const geminiContents = [
      ...session.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    // Try Groq first, fall back to Gemini
    let content = await callGroq(groqMessages);
    if (!content) content = await callGemini(geminiContents);

    if (!content) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: "I'm having trouble connecting right now. Please send your message again." })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return new NextResponse(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    const userMessage = { role: "user" as const, content: message, timestamp: Date.now() };
    const assistantMessage = { role: "assistant" as const, content, timestamp: Date.now() };

    await updateSession(sessionId, {
      messages: [...session.messages, userMessage, assistantMessage],
    });

    // Stream content to client word by word for a live feel
    const encoder = new TextEncoder();
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
