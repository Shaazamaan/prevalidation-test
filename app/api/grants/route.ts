import { NextResponse } from "next/server";
import { getCachedGrants, setCachedGrants } from "@/lib/db";
import type { GrantItem } from "@/lib/db";

const RSS_FEEDS = [
  { url: "https://www.startupindia.gov.in/content/sih/en.feed.xml", source: "Startup India" },
  { url: "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3", source: "PIB India" },
];

type RSS2JSONItem = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  content?: string;
};

async function fetchFeed(feedUrl: string, source: string): Promise<GrantItem[]> {
  try {
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=10`,
      { next: { revalidate: 21600 } }
    );
    if (!res.ok) return [];
    const data = await res.json() as { status: string; items?: RSS2JSONItem[] };
    if (data.status !== "ok" || !data.items) return [];
    return data.items.map((item) => ({
      title: item.title?.trim() ?? "",
      description: (item.description ?? item.content ?? "").replace(/<[^>]+>/g, "").slice(0, 200),
      url: item.link ?? "",
      pubDate: item.pubDate ?? "",
      source,
    })).filter((i) => i.title && i.url);
  } catch {
    return [];
  }
}

export async function GET() {
  const cached = await getCachedGrants();
  if (cached) return NextResponse.json({ grants: cached });

  const results = await Promise.all(RSS_FEEDS.map((f) => fetchFeed(f.url, f.source)));
  const merged = results
    .flat()
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 20);

  if (merged.length > 0) await setCachedGrants(merged);
  return NextResponse.json({ grants: merged });
}
