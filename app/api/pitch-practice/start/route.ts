import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import {
  getPitchPracticeCount,
  savePitchPracticeSession,
  isPitchPaymentUsed,
  markPitchPaymentUsed,
  isUserBanned,
  getToolPrice,
  type PitchPracticeSession,
} from "@/lib/db";
import { verifyPaymentSignature, getRazorpayKeys } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to use Pitch Practice" }, { status: 401 });
  }

  const email = session.user.email.toLowerCase();

  if (await isUserBanned(email)) {
    return NextResponse.json({ error: "Your account has been suspended." }, { status: 403 });
  }

  const body = await req.json() as {
    founderName: string;
    startupName: string;
    oneLiner: string;
    investorType: "angel" | "seed_vc" | "series_a_vc";
    payment?: { orderId: string; paymentId: string; signature: string };
  };

  const { founderName, startupName, oneLiner, investorType, payment } = body;

  if (!founderName?.trim() || !startupName?.trim() || !oneLiner?.trim() || !investorType) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const pricePaise = await getToolPrice("pitch_practice");
  const count = await getPitchPracticeCount(email);
  const isFree = count === 0;

  if (!isFree) {
    if (!payment?.orderId || !payment?.paymentId || !payment?.signature) {
      return NextResponse.json({ error: "Payment required", price: pricePaise }, { status: 402 });
    }
    const { keySecret } = await getRazorpayKeys();
    const valid = verifyPaymentSignature(payment.orderId, payment.paymentId, payment.signature, keySecret);
    if (!valid) return NextResponse.json({ error: "Invalid payment signature" }, { status: 402 });
    if (await isPitchPaymentUsed(payment.orderId)) {
      return NextResponse.json({ error: "Payment already used" }, { status: 402 });
    }
    await markPitchPaymentUsed(payment.orderId);
  }

  const id = uuidv4();
  const ppSession: PitchPracticeSession = {
    id,
    email,
    founderName: founderName.trim(),
    startupName: startupName.trim(),
    oneLiner: oneLiner.trim(),
    investorType,
    exchanges: [],
    score: null,
    payment: isFree ? null : {
      orderId: payment!.orderId,
      paymentId: payment!.paymentId,
      amount: pricePaise,
      isFree: false,
    },
    createdAt: Date.now(),
    completedAt: null,
  };

  await savePitchPracticeSession(ppSession);

  return NextResponse.json({ sessionId: id, isFree });
}
