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
const FEATURE = "hiring_plan";
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
    currentTeam: string;
    stage: string;
    runway: number;
    bottleneck: string;
    payment?: { orderId: string; paymentId: string; signature: string };
  };

  const { idea, currentTeam, stage, runway, bottleneck, payment } = body;

  if (!idea?.trim() || !currentTeam?.trim() || !stage || !bottleneck?.trim()) {
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

  const prompt = `You are a startup talent advisor. Create a strategic hiring plan for the next 3 hires.

Startup idea: ${idea.trim()}
Current team: ${currentTeam.trim()}
Stage: ${stage}
Runway: ${runway} months
Biggest bottleneck: ${bottleneck.trim()}

Return ONLY valid JSON in this exact format:
{
  "firstHire": {
    "role": "job title",
    "why": "why this role first given the bottleneck and stage",
    "skills": ["must-have skill 1", "must-have skill 2", "must-have skill 3"],
    "redFlags": ["interview red flag 1", "interview red flag 2"]
  },
  "secondHire": {
    "role": "job title",
    "why": "why this role second",
    "skills": ["must-have skill 1", "must-have skill 2", "must-have skill 3"]
  },
  "thirdHire": {
    "role": "job title",
    "why": "why this role third",
    "skills": ["must-have skill 1", "must-have skill 2", "must-have skill 3"]
  },
  "hiringMistakes": ["common startup hiring mistake to avoid 1", "common startup hiring mistake to avoid 2", "common startup hiring mistake to avoid 3"],
  "interviewTips": ["practical interview tip 1", "practical interview tip 2", "practical interview tip 3"]
}`;

  try {
    const raw = isFree ? await callGroq(prompt) : await callClaude(prompt);
    const result = parseJSON(raw);
    await incrementAIFeatureUsage(email, FEATURE);
    return NextResponse.json({ result, isFree });
  } catch (err) {
    console.error("Hiring plan error:", err);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
