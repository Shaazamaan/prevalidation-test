import { NextResponse } from "next/server";
import { getCachedNews, setCachedNews } from "@/lib/db";
import type { NewsArticle } from "@/lib/db";

const CURRENTS_KEY = "RoDhQjY4f-2Hs0krtpogPBGjtEa-q4WYd8TDyEF6s_51mr3I";
const NEWS_API_KEY = "2f95bef3aa8f4045bebd157045975a07";

async function fetchCurrents(): Promise<NewsArticle[]> {
  try {
    const res = await fetch(
      `https://api.currentsapi.services/v1/search?language=en&keywords=startup+india+funding+founder&apiKey=${CURRENTS_KEY}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json() as { status: string; news?: { id: string; title: string; description: string; url: string; author: string; published: string; image?: string }[] };
    if (data.status !== "ok" || !data.news) return [];
    return data.news.slice(0, 10).map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description?.slice(0, 200) ?? "",
      url: n.url,
      source: n.author || "Currents",
      publishedAt: n.published,
      imageUrl: n.image || undefined,
    }));
  } catch {
    return [];
  }
}

async function fetchNewsAPI(): Promise<NewsArticle[]> {
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=startup+India+funding&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json() as { status: string; articles?: { title: string; description: string; url: string; source: { name: string }; publishedAt: string; urlToImage?: string }[] };
    if (data.status !== "ok" || !data.articles) return [];
    return data.articles.map((a, i) => ({
      id: `newsapi-${i}-${Date.now()}`,
      title: a.title,
      description: a.description?.slice(0, 200) ?? "",
      url: a.url,
      source: a.source?.name ?? "NewsAPI",
      publishedAt: a.publishedAt,
      imageUrl: a.urlToImage || undefined,
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  const cached = await getCachedNews();
  if (cached) return NextResponse.json({ articles: cached });

  const [c, n] = await Promise.all([fetchCurrents(), fetchNewsAPI()]);
  const merged = [...c, ...n]
    .filter((a) => a.title && a.url)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 20);

  if (merged.length > 0) await setCachedNews(merged);
  return NextResponse.json({ articles: merged });
}
