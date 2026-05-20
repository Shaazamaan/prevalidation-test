import { NextRequest, NextResponse } from "next/server";
import { buildPitchDeckPrompt } from "@/lib/pitch-deck-prompt";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { isAdminRequest } from "@/lib/admin-auth";

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
    };

    const { fileBase64, mimeType, deckText, context, payment } = body;

    if (!fileBase64 && !deckText) {
      return NextResponse.json({ error: "No pitch deck content provided" }, { status: 400 });
    }

    const adminRequest = isAdminRequest(req);
    if (!adminRequest) {
      if (!payment?.orderId || !payment?.paymentId || !payment?.signature) {
        return NextResponse.json({ error: "Payment required" }, { status: 402 });
      }
      const valid = verifyPaymentSignature(payment.orderId, payment.paymentId, payment.signature);
      if (!valid) {
        return NextResponse.json({ error: "Invalid payment signature" }, { status: 402 });
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

    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error("[PitchDeck] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
