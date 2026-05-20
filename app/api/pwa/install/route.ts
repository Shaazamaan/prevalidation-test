import { NextRequest, NextResponse } from "next/server";
import { savePushSubscription } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.subscription) {
      await savePushSubscription({
        endpoint: body.subscription.endpoint,
        keys: body.subscription.keys,
        installedAt: Date.now(),
      });
    } else {
      // Just track install count without subscription
      const { kv } = await import("@vercel/kv");
      await kv.incr("pwa:install:count");
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
