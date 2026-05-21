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
const FEATURE = "pricing_strategy";
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
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT),
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content[0].text as string;
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
    businessModel: string;
    targetCustomer: string;
    currentPricing: string;
    competitorPricing: string;
    payment?: { orderId: string; paymentId: string; signature: string };
  };

  const { idea, businessModel, targetCustomer, currentPricing, competitorPricing, payment } = body;

  if (!idea?.trim() || !businessModel?.trim() || !targetCustomer?.trim()) {
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

  const prompt = `You are a pricing strategist for startups. Recommend the optimal pricing strategy.

Startup idea: ${idea.trim()}
Business model: ${businessModel.trim()}
Target customer: ${targetCustomer.trim()}
Current pricing: ${currentPricing.trim() || "None yet"}
Competitor pricing: ${competitorPricing.trim() || "Unknown"}

Return ONLY valid JSON in this exact format:
{
  "recommended": {
    "model": "pricing model name (e.g., Freemium, Flat monthly, Usage-based)",
    "price": "specific price recommendation with currency and period",
    "rationale": "2-3 sentences explaining why this is optimal"
  },
  "alternatives": [
    {
      "model": "alternative model name",
      "price": "price suggestion",
      "pros": "main advantage",
      "cons": "main drawback"
    },
    {
      "model": "alternative model name",
      "price": "price suggestion",
      "pros": "main advantage",
      "cons": "main drawback"
    }
  ],
  "psychologyTips": ["pricing psychology tip 1", "pricing psychology tip 2", "pricing psychology tip 3"],
  "commonMistakes": ["common mistake to avoid 1", "common mistake to avoid 2", "common mistake to avoid 3"]
}`;

  try {
    const raw = isFree ? await callGroq(prompt) : await callClaude(prompt);
    const result = parseJSON(raw);
    await incrementAIFeatureUsage(email, FEATURE);
    return NextResponse.json({ result, isFree });
  } catch (err) {
    console.error("Pricing strategy error:", err);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
