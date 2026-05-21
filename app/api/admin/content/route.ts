import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getContentItems, saveContentItem, deleteContentItem } from "@/lib/db";
import type { ContentItem } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type") as "tip" | "idea" | undefined;
  const items = await getContentItems(type ?? undefined);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { type?: "tip" | "idea"; body?: string; tags?: string[]; seed?: boolean };

  if (body.seed) {
    await seedContent();
    return NextResponse.json({ success: true });
  }

  if (!body.type || !body.body?.trim()) {
    return NextResponse.json({ error: "type and body required" }, { status: 400 });
  }
  const item: ContentItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: body.type,
    body: body.body.trim(),
    tags: body.tags ?? [],
    addedAt: Date.now(),
  };
  await saveContentItem(item);
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteContentItem(id);
  return NextResponse.json({ success: true });
}

async function seedContent() {
  const now = Date.now();
  const tips: string[] = [
    "Talk to 10 customers before writing a single line of code.",
    "Your first version should do one thing extremely well — not ten things adequately.",
    "Charge for your product from day one, even a small amount. Free users give bad signal.",
    "Build in public: share your progress, struggles, and learnings weekly.",
    "Focus on retention before acquisition. A leaky bucket won't fill no matter how fast you pour.",
    "Find the channel where your customers already spend time — don't try to invent new habits.",
    "Your job title in a startup is 'whatever needs doing today'.",
    "Revenue is the best form of validation — everything else is noise.",
    "A startup pitch is not a product demo. It's a story about a problem and why you're the one to solve it.",
    "The difference between a startup and a lifestyle business is ambition and market size.",
    "Don't raise money to solve problems you should be solving with creativity.",
    "Your co-founder relationship matters more than your idea. Choose wisely.",
    "Do things that don't scale first. Once you understand the pattern, then automate.",
    "The best founders are obsessed with the problem, not in love with their solution.",
    "Investor meetings are job interviews where you're interviewing them too.",
    "Speed is a startup's only sustainable advantage over large companies.",
    "Every 'no' from a potential customer is a free product research session.",
    "Runway is oxygen. Know exactly how many months you have at all times.",
    "Your team's energy is contagious — culture starts with how you show up every day.",
    "A pivot is not failure. Staying committed to a wrong direction is.",
  ];

  const ideas: string[] = [
    "Offer your service manually before building software — validate demand with zero code.",
    "Find one micro-niche and dominate it before expanding horizontally.",
    "Partner with non-competing businesses that serve your exact customer segment.",
    "Create a waitlist with a referral mechanism — early urgency at no cost.",
    "Write one SEO article per week targeting the exact question your customer searches.",
    "Host a free virtual workshop to generate leads and demonstrate expertise.",
    "Create a template or tool that solves a small part of a big problem — free, viral.",
    "Reach out to 5 potential customers every single day via LinkedIn or email.",
    "Start a niche newsletter around the problem space you're solving.",
    "Offer a 'done for you' service first, then productize the repeatable parts.",
    "Launch on Product Hunt on a Tuesday for maximum visibility.",
    "Build in WhatsApp first — it's where your Indian customers already live.",
    "List your service on platforms like Upwork before building your own site.",
    "Create a comparison page: you vs. alternatives — it captures high-intent searchers.",
    "Cold email 50 potential customers this week with a specific offer and one CTA.",
    "Join 3 founder communities and contribute before asking for anything.",
    "Offer a free audit or diagnosis of the problem you solve — it becomes a sales call.",
    "Find one influencer in your niche and offer them early access + a revenue share.",
    "Use YouTube Shorts or Instagram Reels to document your build process.",
    "Submit your startup to every relevant directory — Google indexes them fast.",
  ];

  const allItems = [
    ...tips.map((body, i) => ({ id: `seed-tip-${i}`, type: "tip" as const, body, tags: ["startup", "founder"], addedAt: now })),
    ...ideas.map((body, i) => ({ id: `seed-idea-${i}`, type: "idea" as const, body, tags: ["growth", "zerocost"], addedAt: now })),
  ];

  for (const item of allItems) {
    await saveContentItem(item);
  }
}
