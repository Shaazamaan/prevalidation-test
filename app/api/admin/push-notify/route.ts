import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { isAdminServer } from "@/lib/admin-auth";
import { getAllPushSubscriptions } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isAdminServer()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, url } = await req.json() as { title?: string; body?: string; url?: string };

  if (!title || !body) return NextResponse.json({ error: "title and body are required" }, { status: 400 });

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL ?? "mailto:admin@devbridgekerala.com";

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json(
      { error: "VAPID keys not configured. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to Vercel env vars." },
      { status: 503 }
    );
  }

  const subs = await getAllPushSubscriptions();
  if (subs.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, total: 0, message: "No push subscribers yet." });
  }

  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

  const payload = JSON.stringify({
    title,
    body,
    url: url || "/",
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
