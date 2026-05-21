import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getContentItems, getAllPushSubscriptions } from "@/lib/db";

export const runtime = "nodejs";

// Called by Vercel Cron (vercel.json) or admin trigger
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  // Accept Vercel cron (bearer token) or admin key
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL ?? "mailto:admin@devbridgekerala.com";

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 503 });
  }

  const [items, subs] = await Promise.all([
    getContentItems().catch(() => []),
    getAllPushSubscriptions().catch(() => []),
  ]);

  if (!subs.length) return NextResponse.json({ sent: 0, message: "No subscribers" });
  if (!items.length) return NextResponse.json({ sent: 0, message: "No content items" });

  // Pick a random tip (prefer tips in the morning, ideas in the evening — simple hour check)
  const hour = new Date().getUTCHours() + 5; // IST offset
  const preferType = hour < 14 ? "tip" : "idea";
  const pool = items.filter((i) => i.type === preferType);
  const item = pool[Math.floor(Math.random() * pool.length)] ?? items[Math.floor(Math.random() * items.length)];

  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

  const payload = JSON.stringify({
    title: item.type === "tip" ? "💡 Founder Tip" : "🚀 Growth Idea",
    body: item.body.slice(0, 120),
    url: "/dashboard",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });

  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
        sent++;
      } catch {
        failed++;
      }
    })
  );

  return NextResponse.json({ sent, failed, total: subs.length });
}
