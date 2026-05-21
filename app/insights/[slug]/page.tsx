"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────
type BlogPost = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: number;
  updatedAt: number;
  views: number;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function readingTime(content: string): number {
  return Math.max(1, Math.ceil(content.split(" ").length / 200));
}

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function renderContent(md: string) {
  const lines = md.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("## ")) return <h2 key={i} className="text-white text-xl font-semibold mt-8 mb-3">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="text-white text-lg font-semibold mt-6 mb-2">{line.slice(4)}</h3>;
    if (line.startsWith("# ")) return <h2 key={i} className="text-white text-2xl font-semibold mt-8 mb-4">{line.slice(2)}</h2>;
    if (line.startsWith("- ")) return <li key={i} className="text-[#888] text-sm leading-relaxed ml-4 list-disc">{line.slice(2)}</li>;
    if (line.trim() === "") return <div key={i} className="h-3" />;
    return <p key={i} className="text-[#888] text-sm leading-relaxed">{line}</p>;
  });
}

// ── Bookmark Button ────────────────────────────────────────────────────────────
function BookmarkButton({ slug, isLoggedIn }: { slug: string; isLoggedIn: boolean }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.slugs)) setBookmarked(data.slugs.includes(slug));
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [slug, isLoggedIn]);

  const toggle = useCallback(async () => {
    if (!isLoggedIn || loading) return;
    setLoading(true);
    const method = bookmarked ? "DELETE" : "POST";
    try {
      const res = await fetch("/api/bookmarks", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) setBookmarked(!bookmarked);
    } finally {
      setLoading(false);
    }
  }, [slug, bookmarked, isLoggedIn, loading]);

  if (!isLoggedIn) return null;
  if (!checked) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={bookmarked ? "Remove bookmark" : "Bookmark this article"}
      className="p-1.5 rounded-lg hover:bg-[#1a1a1a] transition"
    >
      {bookmarked ? (
        // Filled bookmark
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8A838">
          <path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z" />
        </svg>
      ) : (
        // Outline bookmark
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
          <path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z" />
        </svg>
      )}
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function InsightPostPage({ params }: { params: { slug: string } }) {
  const { data: session } = useSession();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/insights/${params.slug}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setPost(data.post);
      });

    fetch("/api/insights")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.posts)) {
          setRelated(
            data.posts
              .filter((p: BlogPost) => p.slug !== params.slug)
              .sort((a: BlogPost, b: BlogPost) => b.publishedAt - a.publishedAt)
              .slice(0, 3)
          );
        }
      });
  }, [params.slug]);

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#444] text-sm mb-4">Article not found.</p>
          <Link href="/insights" className="text-[#E8A838] text-sm hover:underline">Back to Insights</Link>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-[#444] text-sm animate-pulse">Loading...</p>
      </main>
    );
  }

  const fullUrl = `${process.env.NEXT_PUBLIC_URL ?? ""}/insights/${post.slug}`;
  const waText = encodeURIComponent(`${post.title} — ${fullUrl}`);
  const liUrl = encodeURIComponent(fullUrl);
  const mins = readingTime(post.content);

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-20 pt-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/insights" className="text-[#555] hover:text-white text-sm transition block mb-8">
          &larr; Back to Insights
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {post.tags.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] rounded-full">{t}</span>
            ))}
          </div>

          <div className="flex items-start justify-between gap-3">
            <h1 className="font-crimson text-3xl sm:text-4xl font-semibold text-white mb-3 leading-tight flex-1">
              {post.title}
            </h1>
            <BookmarkButton slug={post.slug} isLoggedIn={!!session?.user?.email} />
          </div>

          <div className="flex items-center gap-4 text-xs text-[#444] flex-wrap">
            <span>Devbridge Insights</span>
            <span>{fmtDate(post.publishedAt)}</span>
            <span>{post.views} views</span>
            <span className="text-[#E8A838]">{mins} min read</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose-custom space-y-1">
          {renderContent(post.content)}
        </div>

        {/* Share */}
        <div className="mt-10 pt-6 border-t border-[#1a1a1a]">
          <p className="text-[#444] text-xs mb-3">Share this article</p>
          <div className="flex gap-3 flex-wrap">
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs px-4 py-2 bg-[#111] border border-[#222] hover:border-[#25D366] text-[#888] hover:text-[#25D366] rounded-lg transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.17 1.6 5.98L0 24l6.18-1.58A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22c-1.85 0-3.67-.5-5.25-1.44l-.38-.22-3.67.94.98-3.56-.25-.4A9.94 9.94 0 0 1 2 12C2 6.48 6.48 2 12 2c2.67 0 5.18 1.04 7.07 2.93A9.94 9.94 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.47-7.4c-.3-.15-1.77-.87-2.04-.97-.28-.1-.47-.15-.67.15s-.77.97-.95 1.17c-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.78-1.68-2.08-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.57-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.01-1.04 2.47s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/>
              </svg>
              Share on WhatsApp
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${liUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs px-4 py-2 bg-[#111] border border-[#222] hover:border-[#0A66C2] text-[#888] hover:text-[#0A66C2] rounded-lg transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.98 1.98 0 0 1-1.982-1.98c0-1.094.889-1.981 1.982-1.981s1.98.887 1.98 1.981-.887 1.98-1.98 1.98zm1.982 13.019H3.355V9h3.964v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Share on LinkedIn
            </a>
          </div>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-10 pt-6 border-t border-[#1a1a1a]">
            <p className="text-[#444] text-xs mb-4">Related Articles</p>
            <div className="space-y-3">
              {related.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/insights/${rp.slug}`}
                  className="flex items-start justify-between gap-4 bg-[#111] border border-[#1a1a1a] hover:border-[#333] rounded-xl p-4 transition group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium group-hover:text-[#E8A838] transition leading-snug mb-1 line-clamp-2">{rp.title}</p>
                    <p className="text-[#555] text-xs line-clamp-1">{rp.summary}</p>
                  </div>
                  <span className="text-[#E8A838] text-xs shrink-0">{readingTime(rp.content)} min</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer CTAs */}
        <div className="mt-10 pt-6 border-t border-[#1a1a1a]">
          <p className="text-[#444] text-xs mb-4">More from Devbridge</p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/" className="text-xs px-4 py-2 border border-[#333] text-[#888] rounded-lg hover:text-white hover:border-[#555] transition">Readiness Check</Link>
            <Link href="/advisor" className="text-xs px-4 py-2 border border-[#333] text-[#888] rounded-lg hover:text-white hover:border-[#555] transition">Advisor Report</Link>
            <Link href="/match" className="text-xs px-4 py-2 border border-[#333] text-[#888] rounded-lg hover:text-white hover:border-[#555] transition">Find Co-founders</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
