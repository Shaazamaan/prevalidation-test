import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { isCouponUsed, isEmailCouponUsed } from "@/lib/db";

// Format: CODE:PERCENT or CODE:PERCENT:email@specific.com
function parseCoupons(): Record<string, { discount: number; email?: string }> {
  const raw = process.env.COUPON_CODES ?? "";
  const result: Record<string, { discount: number; email?: string }> = {};
  for (const part of raw.split(",")) {
    const segments = part.trim().split(":");
    if (segments.length >= 2) {
      const code = segments[0].trim().toUpperCase();
      const pct = parseInt(segments[1].trim(), 10);
      const email = segments[2]?.trim().toLowerCase();
      if (code && !isNaN(pct)) result[code] = { discount: pct, email };
    }
  }
  return result;
}

function makeToken(code: string, window: number): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  return crypto.createHmac("sha256", secret).update(`${code}:${window}`).digest("hex");
}

function currentWindow(): number {
  return Math.floor(Date.now() / 1000 / 600);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase() ?? "";
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase() ?? "";
  if (!code) return NextResponse.json({ valid: false });

  const coupons = parseCoupons();
  if (!(code in coupons)) return NextResponse.json({ valid: false });

  const { discount, email: restrictedEmail } = coupons[code];

  // Email-specific coupon check
  if (restrictedEmail && email !== restrictedEmail) {
    return NextResponse.json({ valid: false, reason: "not_authorized" });
  }

  // Check per-email usage for email-specific coupons
  if (restrictedEmail) {
    const emailUsed = await isEmailCouponUsed(code, restrictedEmail);
    if (emailUsed) return NextResponse.json({ valid: false, reason: "already_used" });
  }

  if (discount >= 100) {
    const used = await isCouponUsed(code);
    if (used) return NextResponse.json({ valid: false, reason: "already_used" });
    const token = makeToken(code, currentWindow());
    return NextResponse.json({ valid: true, discount: 100, free: true, couponToken: token });
  }

  return NextResponse.json({ valid: true, discount, free: false });
}
