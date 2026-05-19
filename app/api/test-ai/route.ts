import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test Groq
  try {
    const groq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: "Say hello in one word." }],
        stream: false,
        max_tokens: 10,
      }),
    });
    const groqData = await groq.json();
    results.groq = {
      status: groq.status,
      ok: groq.ok,
      response: groqData,
    };
  } catch (e) {
    results.groq = { error: String(e) };
  }

  // Test Gemini
  try {
    const gem = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Say hello in one word." }] }],
        }),
      }
    );
    const gemData = await gem.json();
    results.gemini = {
      status: gem.status,
      ok: gem.ok,
      response: gemData,
    };
  } catch (e) {
    results.gemini = { error: String(e) };
  }

  return NextResponse.json(results);
}
