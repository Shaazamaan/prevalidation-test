import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getAllSessions, getReport, getUser, getFeedPosts } from "@/lib/db";
import { sendWeeklyDigest } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;

  // Get all sessions and feed posts in parallel
  const [allSessions, feedPosts] = await Promise.all([
    getAllSessions().catch(() => [] as Awaited<ReturnType<typeof getAllSessions>>),
    getFeedPosts(200).catch(() => []),
  ]);

  const newFoundersThisWeek = allSessions.filter((s) => s.createdAt > weekAgo).length;
  const feedPostsThisWeek = feedPosts.filter((p) => p.createdAt > weekAgo).length;

  // Build unique email set from authenticated sessions
  const latestByEmail = new Map<string, { sessionId: string; createdAt: number; founderName: string }>();
  for (const s of allSessions) {
    if (!s.email) continue;
    const email = s.email.toLowerCase();
    const existing = latestByEmail.get(email);
    if (!existing || s.createdAt > existing.createdAt) {
      latestByEmail.set(email, { sessionId: s.id, createdAt: s.createdAt, founderName: s.founderName });
    }
  }

  // ISO week key — don't send more than once per week per user
  const now = new Date();
  const weekNum = getISOWeek(now);
  const weekKey = `${now.getUTCFullYear()}-W${weekNum}`;

  let sent = 0;
  let skipped = 0;

  await Promise.allSettled(
    Array.from(latestByEmail.entries()).map(async ([email, { sessionId, createdAt, founderName }]) => {
      const digestKey = `digest:weekly:${weekKey}:${email}`;
      const alreadySent = await kv.get(digestKey);
      if (alreadySent) { skipped++; return; }

      const profile = await getUser(email).catch(() => null);
      const name = profile?.name ?? founderName;

      const report = await getReport(sessionId).catch(() => null);
      const daysAgoLastEval = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));

      await sendWeeklyDigest({
        to: email,
        name,
        newFoundersThisWeek,
        feedPostsThisWeek,
        daysAgoLastEval: report ? daysAgoLastEval : undefined,
      });

      // Mark sent for this week (8 day TTL covers overlap)
      await kv.set(digestKey, true, { ex: 8 * 24 * 3600 });
      sent++;
    })
  );

  return NextResponse.json({ sent, skipped, total: latestByEmail.size, week: weekKey });
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
