import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1484208084271497449/aHvNsA_u710r0SgceFtH6u0sOmSRIF8nTbxzjk75ACbzl_y-_dqHdE18tLlVFLRSwGP9";

export async function POST(req: NextRequest) {
  try {
    const { countryCode, phone, whatsapp, email, message } = await req.json();

    if (!phone || !email || !message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (message.length < 10) {
      return NextResponse.json({ error: "Message too short." }, { status: 400 });
    }

    const embed = {
      title: "📬 New Support Request",
      color: 0xE8A838,
      fields: [
        { name: "📱 Phone", value: `${countryCode} ${phone}`, inline: true },
        { name: "💬 WhatsApp", value: whatsapp ? `${countryCode} ${whatsapp}` : "Not provided", inline: true },
        { name: "📧 Email", value: email, inline: false },
        { name: "💬 Message", value: message.slice(0, 1024), inline: false },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Devbridge Support" },
    };

    const res = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
