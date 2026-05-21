"use client";

import { useState, useEffect } from "react";
import type { NewsArticle, GrantItem } from "@/lib/db";

type Tab = "news" | "grants";

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NewsFeed() {
  const [tab, setTab] = useState<Tab>("news");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [grants, setGrants] = useState<GrantItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === "news" && articles.length === 0) {
      setLoading(true);
      fetch("/api/news").then((r) => r.json()).then((d: { articles?: NewsArticle[] }) => {
        setArticles(d.articles ?? []);
      }).catch(() => {}).finally(() => setLoading(false));
    }
    if (tab === "grants" && grants.length === 0) {
      setLoading(true);
      fetch("/api/grants").then((r) => r.json()).then((d: { grants?: GrantItem[] }) => {
        setGrants(d.grants ?? []);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab, articles.length, grants.length]);

  const items = tab === "news" ? articles : grants;

  return (
    <div>
      <div className="flex items-center gap-1 mb-4">
        <button
          onClick={() => setTab("news")}
          className={`text-xs px-3 py-1.5 rounded-lg transition ${tab === "news" ? "bg-[#1a1a1a] text-white border border-[#333]" : "text-[#555] hover:text-[#888]"}`}
        >
          Startup News
        </button>
        <button
          onClick={() => setTab("grants")}
          className={`text-xs px-3 py-1.5 rounded-lg transition ${tab === "grants" ? "bg-[#1a1a1a] text-white border border-[#333]" : "text-[#555] hover:text-[#888]"}`}
        >
          Grants & Schemes
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-[#1a1a1a] rounded w-3/4 mb-2" />
              <div className="h-2 bg-[#1a1a1a] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-6">
          <p className="text-[#333] text-xs">No {tab === "news" ? "news" : "grants"} available right now.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {tab === "news"
            ? (articles as NewsArticle[]).map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#111] border border-[#1a1a1a] hover:border-[#333] rounded-xl p-4 transition group"
                >
                  <p className="text-white text-sm font-medium leading-snug group-hover:text-[#E8A838] transition line-clamp-2">{a.title}</p>
                  {a.description && <p className="text-[#555] text-xs mt-1 line-clamp-2">{a.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[#333] text-xs">{a.source}</span>
                    <span className="text-[#333] text-xs">{timeAgo(a.publishedAt)}</span>
                  </div>
                </a>
              ))
            : (grants as GrantItem[]).map((g, i) => (
                <a
                  key={i}
                  href={g.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#111] border border-[#1a1a1a] hover:border-[#333] rounded-xl p-4 transition group"
                >
                  <p className="text-white text-sm font-medium leading-snug group-hover:text-[#E8A838] transition line-clamp-2">{g.title}</p>
                  {g.description && <p className="text-[#555] text-xs mt-1 line-clamp-2">{g.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[#333] text-xs">{g.source}</span>
                    {g.pubDate && <span className="text-[#333] text-xs">{timeAgo(g.pubDate)}</span>}
                  </div>
                </a>
              ))
          }
        </div>
      )}
    </div>
  );
}
