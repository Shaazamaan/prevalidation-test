"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type BlogPost = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: number;
  views: number;
  tags: string[];
};

function readingTime(content: string): number {
  return Math.max(1, Math.ceil(content.split(" ").length / 200));
}

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InsightsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.posts)) setPosts(data.posts);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [posts, query]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-20 pt-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-[#555] hover:text-white text-sm transition block mb-8">&larr; Back to Devbridge</Link>
        <h1 className="font-crimson text-3xl sm:text-4xl font-semibold text-white mb-2">Insights</h1>
        <p className="text-[#555] text-sm mb-6">Practical startup wisdom for Indian founders.</p>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
          />
          {query.trim() && (
            <p className="text-[#555] text-xs mt-2">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{query.trim()}&rdquo;
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-[#1a1a1a] rounded w-2/3 mb-2" />
                <div className="h-3 bg-[#151515] rounded w-full mb-1" />
                <div className="h-3 bg-[#151515] rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            {query.trim() ? (
              <p className="text-[#444] text-sm">No articles match &ldquo;{query.trim()}&rdquo;. Try a different search.</p>
            ) : (
              <p className="text-[#444] text-sm">No posts yet. Check back soon.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((post) => (
              <Link
                key={post.slug}
                href={`/insights/${post.slug}`}
                className="block bg-[#111] border border-[#222] hover:border-[#444] rounded-2xl p-5 transition group"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white font-semibold text-base group-hover:text-[#E8A838] transition leading-snug mb-1">
                      {post.title}
                    </h2>
                    <p className="text-[#555] text-sm leading-relaxed line-clamp-2">{post.summary}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-[#444] text-xs">{fmtDate(post.publishedAt)}</span>
                      <span className="text-[#E8A838] text-xs">{readingTime(post.content)} min read</span>
                      {post.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[#333] text-xs">{post.views} views</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
