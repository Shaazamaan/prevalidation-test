import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/db";
import { SYSTEM_PROMPT } from "@/lib/prompt";

export const runtime = "nodejs";

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

    const userMessage = { role: "user" as const, content: message, timestamp: Date.now() };

    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
              "X-Title": "Founder Readiness Check",
            },
            body: JSON.stringify({
              model: "mistralai/mistral-7b-instruct:free",
              messages,
              stream: true,
              max_tokens: 800,
              temperature: 0.4,
            }),
          });

          if (!response.ok) {
            controller.enqueue(encoder.encode(`data: {"error":"AI unavailable"}\n\n`));
            controller.close();
            return;
          }

          const reader = response.body!.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
            for (const line of lines) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  fullResponse += token;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
              } catch {
                // partial chunk
              }
            }
          }

          const assistantMessage = {
            role: "assistant" as const,
            content: fullResponse,
            timestamp: Date.now(),
          };

          await updateSession(sessionId, {
            messages: [...session.messages, userMessage, assistantMessage],
          });

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          console.error(err);
          controller.enqueue(encoder.encode(`data: {"error":"Stream failed"}\n\n`));
          controller.close();
        }
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
