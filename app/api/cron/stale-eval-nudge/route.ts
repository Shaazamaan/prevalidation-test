import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getAllSessions, getReport, getUser } from "@/lib/db";
import { sendStaleEvalEmail } from "@/lib/email";

export const runtime = "nodejs";

const STALE_DAYS = 30;
const NUDGE_COOLDOWN_DAYS = 28; // don't email same person more than once per 28 days

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allSessions = await getAllSessions().catch(() => []);
  if (!allSessions.length) return NextResponse.json({ sent: 0, skipped: 0 });

  // Group sessions by email, keep the most recent per user
  const latestByEmail = new Map<string, { sessionId: string; createdAt: number; founderName: string; email: string }>();
  for (const s of allSessions) {
    if (!s.email) continue;
    const email = s.email.toLowerCase();
    const existing = latestByEmail.get(email);
    if (!existing || s.createdAt > existing.createdAt) {
      latestByEmail.set(email, { sessionId: s.id, createdAt: s.createdAt, founderName: s.founderName, email });
    }
  }

  const cutoff = Date.now() - STALE_DAYS * 24 * 3600 * 1000;
  let sent = 0;
  let skipped = 0;

  await Promise.allSettled(
    Array.from(latestByEmail.values()).map(async ({ sessionId, createdAt, founderName, email }) => {
      if (createdAt > cutoff) { skipped++; return; } // not stale yet

      // Check cooldown — don't spam the same user
      const nudgeKey = `stale:nudged:${email}`;
      const alreadyNudged = await kv.get(nudgeKey);
      if (alreadyNudged) { skipped++; return; }

      const report = await getReport(sessionId).catch(() => null);
      if (!report?.realityScore) { skipped++; return; }

      // Try to get the user's real name from profile
      const profile = await getUser(email).catch(() => null);
      const name = profile?.name ?? founderName;

      const daysAgo = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));

      await sendStaleEvalEmail({
        to: email,
        name,
        score: report.realityScore,
        verdict: report.verdict,
        daysAgo,
      });

      // Mark as nudged for 28 days
      await kv.set(nudgeKey, true, { ex: NUDGE_COOLDOWN_DAYS * 24 * 3600 });
      sent++;
    })
  );

  return NextResponse.json({ sent, skipped, total: latestByEmail.size });
}
