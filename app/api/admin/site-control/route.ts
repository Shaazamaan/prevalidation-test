import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { setSitePaused, isSitePaused } from "@/lib/db";

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1484208084271497449/aHvNsA_u710r0SgceFtH6u0sOmSRIF8nTbxzjk75ACbzl_y-_dqHdE18tLlVFLRSwGP9";

async function sendDiscordAlert(message: string, title: string, color: number) {
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{ title, description: message, color, timestamp: new Date().toISOString(), footer: { text: "Devbridge Admin" } }],
      }),
    });
  } catch {}
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const paused = await isSitePaused();
  return NextResponse.json({ paused });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, message } = await req.json();

  if (action === "pause") {
    await setSitePaused(true);
    await sendDiscordAlert("🔴 Site has been **PAUSED** by admin. Evaluate routes return 503.", "Site Paused", 0xFF4444);
    return NextResponse.json({ success: true, paused: true });
  }

  if (action === "resume") {
    await setSitePaused(false);
    await sendDiscordAlert("🟢 Site has been **RESUMED** by admin. All services active.", "Site Resumed", 0x44FF44);
    return NextResponse.json({ success: true, paused: false });
  }

  if (action === "credit_alert") {
    await sendDiscordAlert(
      message ?? "⚠️ **API credit is running low!** Please recharge the Anthropic API account at console.anthropic.com. Site may pause soon if not recharged.",
      "🚨 Low API Credit Alert",
      0xFFAA00
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
