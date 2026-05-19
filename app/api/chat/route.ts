import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/db";
import { SYSTEM_PROMPT } from "@/lib/prompt";

export const runtime = "nodejs";

// Try Groq first (fastest), fall back to Gemini
async function streamFromGroq(
  messages: { role: string; content: string }[],
  onToken: (t: string) => void
): Promise<boolean> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        stream: true,
        max_tokens: 1024,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      console.error("Groq error:", response.status, await response.text());
      return false;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return true;
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) onToken(token);
        } catch { /* partial */ }
      }
    }
    return true;
  } catch (err) {
    console.error("Groq stream error:", err);
    return false;
  }
}

async function streamFromGemini(
  contents: { role: string; parts: { text: string }[] }[],
  onToken: (t: string) => void
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${process.env.GOOGLE_AI_API_KEY}`,
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

    if (!response.ok) {
      console.error("Gemini error:", response.status, await response.text());
      return false;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        try {
          const parsed = JSON.parse(data);
          const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (token) onToken(token);
        } catch { /* partial */ }
      }
    }
    return true;
  } catch (err) {
    console.error("Gemini stream error:", err);
    return false;
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

    const userMessage = { role: "user" as const, content: message, timestamp: Date.now() };
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        const send = (token: string) => {
          fullResponse += token;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
        };

        // Try Groq → fall back to Gemini
        let ok = await streamFromGroq(groqMessages, send);
        if (!ok) {
          fullResponse = "";
          ok = await streamFromGemini(geminiContents, send);
        }

        if (!ok) {
          controller.enqueue(encoder.encode(`data: {"error":"All AI providers failed. Please try again."}\n\n`));
          controller.close();
          return;
        }

        await updateSession(sessionId, {
          messages: [
            ...session.messages,
            userMessage,
            { role: "assistant" as const, content: fullResponse, timestamp: Date.now() },
          ],
        });

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
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
