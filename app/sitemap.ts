import { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXTAUTH_URL ?? "https://devbridgekerala.com").replace(/\/$/, "");
  const now = new Date();

  const posts = await getAllBlogPosts().catch(() => []);
  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/insights/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const toolSlugs = ["pivot-advisor", "interview-script", "gtm-strategy", "north-star", "one-pager", "landing-copy", "term-sheet", "pricing-strategy", "hiring-plan", "fundraising-timeline"];
  const toolEntries: MetadataRoute.Sitemap = toolSlugs.map((slug) => ({
    url: `${base}/tools/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const evaluateTypes = ["saas", "ecommerce", "marketplace", "fintech", "edtech", "healthtech", "b2b", "d2c"];
  const evaluateEntries: MetadataRoute.Sitemap = evaluateTypes.map((type) => ({
    url: `${base}/evaluate/${type}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/advisor`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/pitch-deck`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/insights`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/match`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/pitch-practice`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/feed`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/tools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/runway`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/jobs`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/buddy`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/demo-day`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/expert-hours`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/directory`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/circles`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/events`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/dna`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/okr`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/legal`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/status`, lastModified: now, changeFrequency: "daily", priority: 0.4 },
    { url: `${base}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ...toolEntries,
    ...evaluateEntries,
    ...postEntries,
  ];
}
