import { NextRequest, NextResponse } from "next/server";
import { getAllEmailDrips, updateEmailDrip } from "@/lib/db";
import { sendDay1BreakdownEmail, sendDay3RecommendationsEmail, sendDay7CommunityEmail } from "@/lib/email";

export const runtime = "nodejs";

const DAY1_MS = 24 * 3600 * 1000;
const DAY3_MS = 3 * 24 * 3600 * 1000;
const DAY7_MS = 7 * 24 * 3600 * 1000;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drips = await getAllEmailDrips();
  const now = Date.now();

  let day1Sent = 0, day3Sent = 0, day7Sent = 0, skipped = 0;

  await Promise.allSettled(
    drips.map(async (drip) => {
      const age = now - drip.firstEvalAt;

      // Day 1: send 24h after first eval
      if (!drip.day1SentAt && age >= DAY1_MS && age < DAY3_MS) {
        await sendDay1BreakdownEmail({
          to: drip.email,
          name: drip.name,
          score: drip.score,
          verdict: drip.verdict,
          sessionId: drip.sessionId,
        }).catch(() => {});
        await updateEmailDrip(drip.email, { day1SentAt: now });
        day1Sent++;
        return;
      }

      // Day 3: send 3 days after first eval
      if (!drip.day3SentAt && age >= DAY3_MS && age < DAY7_MS) {
        await sendDay3RecommendationsEmail({
          to: drip.email,
          name: drip.name,
          score: drip.score,
          verdict: drip.verdict,
        }).catch(() => {});
        await updateEmailDrip(drip.email, { day3SentAt: now });
        day3Sent++;
        return;
      }

      // Day 7: send 7 days after first eval
      if (!drip.day7SentAt && age >= DAY7_MS) {
        await sendDay7CommunityEmail({
          to: drip.email,
          name: drip.name,
          score: drip.score,
        }).catch(() => {});
        await updateEmailDrip(drip.email, { day7SentAt: now });
        day7Sent++;
        return;
      }

      skipped++;
    })
  );

  return NextResponse.json({ day1Sent, day3Sent, day7Sent, skipped, total: drips.length });
}
