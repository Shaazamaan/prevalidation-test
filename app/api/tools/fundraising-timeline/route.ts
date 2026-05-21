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
const FEATURE = "fundraising_timeline";
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
    readinessScore: number;
    weakestAreas: string[];
    targetRaise: string;
    stage: string;
    payment?: { orderId: string; paymentId: string; signature: string };
  };

  const { readinessScore, weakestAreas, targetRaise, stage, payment } = body;

  if (readinessScore === undefined || !targetRaise?.trim() || !stage) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
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

  const prompt = `You are a fundraising strategist for Indian startups. Create a realistic fundraising timeline.

Current readiness score: ${readinessScore}/100
Weakest areas: ${weakestAreas.join(", ") || "Not specified"}
Target raise amount: ${targetRaise.trim()}
Stage: ${stage}

Return ONLY valid JSON in this exact format:
{
  "weeksToReady": <integer number of weeks needed to be investor-ready>,
  "milestones": [
    { "week": <week number>, "action": "specific action to take", "outcome": "expected outcome" },
    { "week": <week number>, "action": "specific action to take", "outcome": "expected outcome" },
    { "week": <week number>, "action": "specific action to take", "outcome": "expected outcome" },
    { "week": <week number>, "action": "specific action to take", "outcome": "expected outcome" },
    { "week": <week number>, "action": "specific action to take", "outcome": "expected outcome" }
  ],
  "criticalPath": ["most critical thing 1", "most critical thing 2", "most critical thing 3"],
  "investorExpectations": ["what investors at this stage expect 1", "what investors expect 2", "what investors expect 3"],
  "warningIfRaiseNow": "honest 2-3 sentence warning about risks of raising right now given the readiness score"
}`;

  try {
    const raw = isFree ? await callGroq(prompt) : await callClaude(prompt);
    const result = parseJSON(raw);
    await incrementAIFeatureUsage(email, FEATURE);
    return NextResponse.json({ result, isFree });
  } catch (err) {
    console.error("Fundraising timeline error:", err);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
