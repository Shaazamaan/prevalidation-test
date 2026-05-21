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
const FEATURE = "term_sheet";
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
      temperature: 0.3,
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
    termSheetText: string;
    payment?: { orderId: string; paymentId: string; signature: string };
  };

  const { termSheetText, payment } = body;

  if (!termSheetText?.trim() || termSheetText.trim().length < 50) {
    return NextResponse.json({ error: "Please paste your term sheet text (minimum 50 characters)" }, { status: 400 });
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

  const truncated = termSheetText.trim().slice(0, 3000);

  const prompt = `You are a startup lawyer and investor relations expert. Explain this term sheet in plain English for a first-time founder.

TERM SHEET:
${truncated}

Return ONLY valid JSON in this exact format:
{
  "summary": "2-3 sentence plain English summary of the overall deal",
  "clauses": [
    {
      "term": "clause name",
      "plainEnglish": "what this means in simple language",
      "founderImpact": "how this affects the founder specifically",
      "redFlag": true or false
    }
  ],
  "overallAssessment": "2-3 sentences on whether this is a fair deal and why",
  "negotiationTips": ["specific negotiation tip 1", "specific negotiation tip 2", "specific negotiation tip 3", "specific negotiation tip 4"]
}

Identify all key clauses. Mark red flags honestly. This is educational only, not legal advice.`;

  try {
    const raw = isFree ? await callGroq(prompt) : await callClaude(prompt);
    const result = parseJSON(raw);
    await incrementAIFeatureUsage(email, FEATURE);
    return NextResponse.json({ result, isFree });
  } catch (err) {
    console.error("Term sheet error:", err);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
