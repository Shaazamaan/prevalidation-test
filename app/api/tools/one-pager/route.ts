import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAIFeatureUsageCount,
  incrementAIFeatureUsage,
  getAIFeaturePrice,
  isUserBanned,
} from "@/lib/db";
import { verifyPaymentSignature, getRazorpayKeys } from "@/lib/razorpay";

export const runtime = "nodejs";
const FEATURE = "one_pager";
const TIMEOUT = 30000;

async function callGroq(prompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT),
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  });
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function callClaude(prompt: string): Promise<string> {
  const { Anthropic } = await import("@anthropic-ai/sdk");
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });
  return (msg.content[0] as { text: string }).text;
}

function parseJSON(text: string) {
  const match = /\{[\s\S]*\}/.exec(text);
  if (!match) throw new Error("No JSON found");
  return JSON.parse(match[0]);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const email = session.user.email.toLowerCase();

  if (await isUserBanned(email)) {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }

  const body = await req.json() as {
    startupName: string;
    oneLiner: string;
    problem: string;
    solution: string;
    marketSize: string;
    traction: string;
    team: string;
    ask: string;
    payment?: { orderId: string; paymentId: string; signature: string };
  };

  const { startupName, oneLiner, problem, solution, marketSize, traction, team, ask, payment } = body;

  if (!startupName?.trim() || !oneLiner?.trim() || !problem?.trim() || !solution?.trim()) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const count = await getAIFeatureUsageCount(email, FEATURE);
  const isFree = count === 0;

  if (!isFree) {
    if (!payment?.orderId || !payment?.paymentId || !payment?.signature) {
      const price = await getAIFeaturePrice();
      return NextResponse.json({ error: "Payment required", price }, { status: 402 });
    }
    const { keySecret } = await getRazorpayKeys();
    const valid = verifyPaymentSignature(payment.orderId, payment.paymentId, payment.signature, keySecret);
    if (!valid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 402 });
    }
  }

  const prompt = `You are a startup pitch writer. Create a compelling investor one-pager.

Startup name: ${startupName.trim()}
One-liner: ${oneLiner.trim()}
Problem: ${problem.trim()}
Solution: ${solution.trim()}
Market size: ${marketSize.trim()}
Traction: ${traction.trim()}
Team: ${team.trim()}
Ask (funding): ${ask.trim()}

Return ONLY valid JSON in this exact format:
{
  "headline": "bold, punchy headline (max 10 words)",
  "problem": "2-3 sentences describing the problem with emotional weight",
  "solution": "2-3 sentences describing the solution clearly",
  "market": "market size and opportunity in 2 sentences",
  "traction": "traction highlights formatted compellingly",
  "team": "team description that builds credibility",
  "ask": "funding ask with use of funds in 2 sentences",
  "cta": "call to action line for the investor"
}`;

  try {
    const raw = isFree ? await callGroq(prompt) : await callClaude(prompt);
    const result = parseJSON(raw);
    await incrementAIFeatureUsage(email, FEATURE);
    return NextResponse.json({ result, isFree });
  } catch (err) {
    console.error("One-pager error:", err);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
