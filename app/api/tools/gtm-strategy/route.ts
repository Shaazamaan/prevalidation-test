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
const FEATURE = "gtm_strategy";
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
    idea: string;
    targetCustomer: string;
    stage: string;
    primaryChannel: string;
    payment?: { orderId: string; paymentId: string; signature: string };
  };

  const { idea, targetCustomer, stage, primaryChannel, payment } = body;

  if (!idea?.trim() || !targetCustomer?.trim() || !stage || !primaryChannel) {
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

  const prompt = `You are a GTM (Go-To-Market) strategist for early-stage startups. Create a 90-day GTM plan.

Startup idea: ${idea.trim()}
Target customer: ${targetCustomer.trim()}
Current stage: ${stage}
Primary channel: ${primaryChannel}

Return ONLY valid JSON in this exact format:
{
  "week1_4": ["specific action 1", "specific action 2", "specific action 3", "specific action 4"],
  "week5_8": ["specific action 1", "specific action 2", "specific action 3", "specific action 4"],
  "week9_12": ["specific action 1", "specific action 2", "specific action 3", "specific action 4"],
  "channels": [
    {
      "name": "channel name",
      "tactics": "2-3 specific tactics for this channel",
      "metrics": "key metric to track"
    }
  ],
  "northStar": "single most important metric that defines success for these 90 days"
}

Make actions specific, measurable, and appropriate for the ${stage} stage. Include 3 channels.`;

  try {
    const raw = isFree ? await callGroq(prompt) : await callClaude(prompt);
    const result = parseJSON(raw);
    await incrementAIFeatureUsage(email, FEATURE);
    return NextResponse.json({ result, isFree });
  } catch (err) {
    console.error("GTM strategy error:", err);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
