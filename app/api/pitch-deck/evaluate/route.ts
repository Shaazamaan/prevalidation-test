import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { buildPitchDeckPrompt } from "@/lib/pitch-deck-prompt";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { isAdminRequest } from "@/lib/admin-auth";
import { savePitchDeckSession, hashIP, isPaymentUsed, markPaymentUsed, checkRateLimit } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const TIMEOUT = 30000;

type AIResult = { content: string | null; error?: string };
type PaymentData = { orderId: string; paymentId: string; signature: string };

interface PitchDeckReport {
  track: string;
  dbScore: number;
  grScore: number;
  overallVerdict: string;
  executiveSummary: string;
  [key: string]: unknown;
}

async function callClaudeWithFile(
  prompt: string,
  fileContent: string,
  mimeType: string
): Promise<AIResult> {
  try {
    const isPDF = mimeType === "application/pdf";
    const contentBlock = isPDF
      ? {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: fileContent,
          },
        }
      : {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType,
            data: fileContent,
          },
        };

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
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: [contentBlock, { type: "text", text: prompt }],
          },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) return { content: null, error: `Claude ${res.status}: ${data?.error?.message}` };
    return { content: data.content?.[0]?.text ?? null };
  } catch (e) {
    return { content: null, error: `Claude exception: ${String(e)}` };
  }
}

async function callClaudeTextOnly(prompt: string, deckText: string): Promise<AIResult> {
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
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: `${prompt}\n\n## PITCH DECK CONTENT (extracted text)\n\n${deckText}`,
          },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) return { content: null, error: `Claude ${res.status}: ${data?.error?.message}` };
    return { content: data.content?.[0]?.text ?? null };
  } catch (e) {
    return { content: null, error: `Claude exception: ${String(e)}` };
  }
}

function extractPitchReport(text: string): PitchDeckReport | null {
  const match = /<PITCH_REPORT>([\s\S]*?)<\/PITCH_REPORT>/.exec(text);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim()) as PitchDeckReport;
    if (!parsed.track || typeof parsed.dbScore !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      fileBase64?: string;
      mimeType?: string;
      deckText?: string;
      context?: string;
      payment?: PaymentData;
      founderName?: string;
      founderEmail?: string;
      founderPhone?: string;
      founderCountry?: string;
    };

    const { fileBase64, mimeType, deckText, context, payment, founderName, founderEmail, founderPhone, founderCountry } = body;

    if (!fileBase64 && !deckText) {
      return NextResponse.json({ error: "No pitch deck content provided" }, { status: 400 });
    }

    const adminRequest = isAdminRequest(req);

    if (!adminRequest) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown";
      const ipHash = await hashIP(ip);
      const allowed = await checkRateLimit("pitchdeck", ipHash, 10);
      if (!allowed) {
        return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
      }
    }
    if (!adminRequest) {
      if (!payment?.orderId || !payment?.paymentId || !payment?.signature) {
        return NextResponse.json({ error: "Payment required" }, { status: 402 });
      }
      const valid = verifyPaymentSignature(payment.orderId, payment.paymentId, payment.signature);
      if (!valid) {
        return NextResponse.json({ error: "Invalid payment signature" }, { status: 402 });
      }
      if (await isPaymentUsed(payment.orderId)) {
        return NextResponse.json({ error: "Payment already used" }, { status: 402 });
      }
    }

    const prompt = buildPitchDeckPrompt(context);
    let result: AIResult;

    if (fileBase64 && mimeType) {
      result = await callClaudeWithFile(prompt, fileBase64, mimeType);
    } else {
      result = await callClaudeTextOnly(prompt, deckText ?? "");
    }

    if (!result.content) {
      console.error("[PitchDeck] AI failed:", result.error);
      return NextResponse.json(
        { error: "AI evaluation unavailable. Please try again." },
        { status: 503 }
      );
    }

    const report = extractPitchReport(result.content);
    if (!report) {
      console.error("[PitchDeck] Could not parse report. Raw:", result.content.slice(0, 500));
      return NextResponse.json(
        { error: "Failed to parse evaluation. Please try again." },
        { status: 500 }
      );
    }

    const sessionId = uuidv4();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown";
    const ipHash = await hashIP(ip);

    if (payment) await markPaymentUsed(payment.orderId);

    await savePitchDeckSession({
      id: sessionId,
      tool: "pitch-deck",
      founderName: founderName,
      email: founderEmail,
      phone: founderPhone,
      country: founderCountry,
      context: context,
      report: report as unknown as Record<string, unknown>,
      dbScore: report.dbScore,
      grScore: report.grScore,
      overallVerdict: report.overallVerdict,
      createdAt: Date.now(),
      ipHash,
    });

    return NextResponse.json({ success: true, report, sessionId });
  } catch (err) {
    console.error("[PitchDeck] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
