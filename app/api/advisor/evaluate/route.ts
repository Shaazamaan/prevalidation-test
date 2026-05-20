import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { buildAdvisorPrompt, type AdvisorIntake } from "@/lib/advisor-prompt";
import { verifyPaymentSignature, getRazorpayKeys } from "@/lib/razorpay";
import { isAdminRequest } from "@/lib/admin-auth";
import { saveAdvisorSession, hashIP, isPaymentUsed, markPaymentUsed, checkRateLimit, isCouponUsed, markCouponUsed, isSitePaused, markEmailCouponUsed, incrementCouponUsage, type PaymentRecord } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const TIMEOUT = 25000;

type AIResult = { content: string | null; error?: string };
type PaymentData = { orderId: string; paymentId: string; signature: string; amount?: number; couponToken?: string };

async function callClaude(prompt: string): Promise<AIResult> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    if (!res.ok) return { content: null, error: `Claude ${res.status}: ${data?.error?.message}` };
    return { content: data.content?.[0]?.text ?? null };
  } catch (e) {
    return { content: null, error: `Claude exception: ${String(e)}` };
  }
}

async function callGroq(prompt: string): Promise<AIResult> {
  try {
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
        stream: false,
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { content: null, error: `Groq ${res.status}: ${data?.error?.message}` };
    return { content: data.choices?.[0]?.message?.content ?? null };
  } catch (e) {
    return { content: null, error: `Groq exception: ${String(e)}` };
  }
}

async function callGemini(prompt: string): Promise<AIResult> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(TIMEOUT),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) return { content: null, error: `Gemini ${res.status}: ${data?.error?.message}` };
    return { content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? null };
  } catch (e) {
    return { content: null, error: `Gemini exception: ${String(e)}` };
  }
}

async function raceFirst(fns: (() => Promise<AIResult>)[]): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = 0;
    const total = fns.length;
    if (total === 0) { resolve(null); return; }
    fns.forEach((fn) => {
      fn().then((result) => {
        settled++;
        if (result.content) resolve(result.content);
        else if (settled === total) resolve(null);
      }).catch(() => {
        settled++;
        if (settled === total) resolve(null);
      });
    });
  });
}

async function getAIResponse(prompt: string): Promise<string | null> {
  const claude = await callClaude(prompt);
  if (claude.content) return claude.content;
  return raceFirst([() => callGroq(prompt), () => callGemini(prompt)]);
}

function verifyCouponToken(code: string, token: string): boolean {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  const now = Math.floor(Date.now() / 1000 / 600);
  for (const w of [now, now - 1]) {
    const expected = crypto.createHmac("sha256", secret).update(`${code}:${w}`).digest("hex");
    if (expected === token) return true;
  }
  return false;
}

interface AdvisorReport {
  pathway: string;
  pathwayLabel: string;
  overallScore: number;
  verdict: string;
  finalMessage: string;
  [key: string]: unknown;
}

function extractAdvisorReport(text: string): AdvisorReport | null {
  const match = /<ADVISOR_REPORT>([\s\S]*?)<\/ADVISOR_REPORT>/.exec(text);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim()) as AdvisorReport;
    if (!parsed.pathway || !parsed.verdict) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      intake: AdvisorIntake;
      payment?: PaymentData;
      founderEmail?: string;
      founderPhone?: string;
      founderCountry?: string;
    };

    const { intake, payment, founderEmail, founderPhone, founderCountry } = body;

    const isFreeOrder = payment?.orderId?.startsWith("FREE_");
    const couponCode = isFreeOrder ? payment!.orderId.replace("FREE_", "") : undefined;

    if (!intake?.founderName || !intake?.problemStatement) {
      return NextResponse.json({ error: "Missing required intake fields" }, { status: 400 });
    }

    const adminRequest = isAdminRequest(req);

    const paused = await isSitePaused();
    if (paused && !adminRequest) {
      return NextResponse.json({
        error: "🚧 Our ATM machine is empty — we're refilling it! The army is on the way. Please try again in a little while. We apologize for the inconvenience! 💛"
      }, { status: 503 });
    }

    const { keySecret: rzpSecret, mode: rzpMode } = await getRazorpayKeys();

    if (!adminRequest) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown";
      const ipHash = await hashIP(ip);
      const allowed = await checkRateLimit("advisor", ipHash, 10);
      if (!allowed) {
        return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
      }
    }
    if (!adminRequest) {
      if (!payment?.orderId || !payment?.paymentId || !payment?.signature) {
        return NextResponse.json({ error: "Payment required" }, { status: 402 });
      }
      if (isFreeOrder && couponCode) {
        const tokenValid = verifyCouponToken(couponCode, payment.signature);
        if (!tokenValid) return NextResponse.json({ error: "Invalid coupon token" }, { status: 402 });
        if (await isCouponUsed(couponCode)) return NextResponse.json({ error: "Coupon already used" }, { status: 402 });
      } else {
        const valid = verifyPaymentSignature(payment.orderId, payment.paymentId, payment.signature, rzpSecret);
        if (!valid) {
          return NextResponse.json({ error: "Invalid payment signature" }, { status: 402 });
        }
        if (await isPaymentUsed(payment.orderId)) {
          return NextResponse.json({ error: "Payment already used" }, { status: 402 });
        }
      }
    }

    const prompt = buildAdvisorPrompt(intake);
    const content = await getAIResponse(prompt);

    if (!content) {
      return NextResponse.json(
        { error: "AI providers unavailable. Please try again in 30 seconds." },
        { status: 503 }
      );
    }

    const report = extractAdvisorReport(content);
    if (!report) {
      console.error("[Advisor] Could not parse report. Raw:", content.slice(0, 500));
      return NextResponse.json(
        { error: "Failed to parse evaluation. Please try again." },
        { status: 500 }
      );
    }

    const sessionId = uuidv4();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown";
    const ipHash = await hashIP(ip);

    if (isFreeOrder && couponCode) {
      await markCouponUsed(couponCode);
      if (founderEmail) await markEmailCouponUsed(couponCode, founderEmail);
      await incrementCouponUsage(couponCode, founderEmail ?? "unknown");
    } else if (payment && !isFreeOrder) {
      await markPaymentUsed(payment.orderId);
    }

    const paymentRecord: PaymentRecord = {
      orderId: payment?.orderId ?? "ADMIN",
      paymentId: payment?.paymentId ?? "ADMIN",
      amount: isFreeOrder ? 0 : adminRequest ? 0 : (payment?.amount ?? 0),
      coupon: couponCode,
      isFree: isFreeOrder ?? false,
      isAdmin: adminRequest,
      mode: rzpMode,
      paidAt: Date.now(),
    };

    await saveAdvisorSession({
      id: sessionId,
      tool: "advisor",
      founderName: intake.founderName,
      email: founderEmail,
      phone: founderPhone,
      country: founderCountry ?? intake.location,
      intake: intake as unknown as Record<string, unknown>,
      report: report as unknown as Record<string, unknown>,
      pathway: report.pathway,
      pathwayLabel: report.pathwayLabel,
      overallScore: report.overallScore,
      createdAt: Date.now(),
      ipHash,
      payment: paymentRecord,
    });

    return NextResponse.json({ success: true, report, sessionId });
  } catch (err) {
    console.error("[Advisor] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
