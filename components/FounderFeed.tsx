"use client";

import { useState, useEffect } from "react";

type FeedPost = {
  id: string;
  body: string;
  category: "win" | "learning" | "question" | "milestone";
  stage?: string;
  reactions: { fire: number; clap: number; think: number };
  createdAt: number;
};

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  win: { label: "Win", color: "text-green-400 bg-green-950/40 border-green-800/30" },
  learning: { label: "Learning", color: "text-blue-400 bg-blue-950/40 border-blue-800/30" },
  question: { label: "Question", color: "text-yellow-400 bg-yellow-950/30 border-yellow-800/30" },
  milestone: { label: "Milestone", color: "text-[#E8A838] bg-[#1a1a0a] border-[#E8A838]/30" },
};

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function FounderFeed({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState<FeedPost["category"]>("win");
  const [newStage, setNewStage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reacted, setReacted] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/feed")
      .then((r) => r.json())
      .then((d: { posts?: FeedPost[] }) => { if (d.posts) setPosts(d.posts); })
      .finally(() => setLoading(false));
  }, []);

  const submitPost = async () => {
    if (!newBody.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newBody.trim(), category: newCategory, stage: newStage }),
    });
    const d = await res.json() as { post?: FeedPost; error?: string };
    if (d.post) {
      setPosts((p) => [d.post!, ...p]);
      setNewBody("");
      setNewStage("");
      setShowForm(false);
    }
    setSubmitting(false);
  };

  const react = async (postId: string, type: "fire" | "clap" | "think") => {
    const key = `${postId}:${type}`;
    if (reacted.has(key)) return;
    setReacted((s) => new Set(Array.from(s).concat(key)));
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, reactions: { ...p.reactions, [type]: p.reactions[type] + 1 } } : p));
    await fetch("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction: { postId, type } }),
    }).catch(() => {});
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-14 pb-24 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-1">Founder Feed</p>
            <h1 className="font-crimson text-2xl font-semibold text-white">What founders are saying</h1>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="text-xs px-3 py-2 bg-[#E8A838] text-black font-medium rounded-lg hover:bg-[#d4962e] transition"
            >
              + Post
            </button>
          )}
        </div>

        {/* Post form */}
        {showForm && isAuthenticated && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 mb-4">
            <div className="flex gap-2 mb-3 flex-wrap">
              {(Object.keys(CATEGORY_LABELS) as FeedPost["category"][]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNewCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${newCategory === cat ? CATEGORY_LABELS[cat].color : "text-[#444] border-[#222]"}`}
                >
                  {CATEGORY_LABELS[cat].label}
                </button>
              ))}
            </div>
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value.slice(0, 280))}
              placeholder={newCategory === "win" ? "We just hit 100 users! 🎉" : newCategory === "question" ? "How are you handling B2B sales cycles?" : newCategory === "learning" ? "Biggest lesson this week..." : "Launched our MVP today..."}
              rows={3}
              className="w-full bg-[#0d0d0d] border border-[#222] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <input
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  placeholder="Stage (optional)"
                  className="bg-[#0d0d0d] border border-[#222] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#333] focus:outline-none w-28"
                />
                <span className="text-[10px] text-[#333]">{newBody.length}/280</span>
              </div>
              <button
                onClick={submitPost}
                disabled={submitting || !newBody.trim()}
                className="text-xs px-3 py-1.5 bg-[#E8A838] text-black font-medium rounded-lg hover:bg-[#d4962e] transition disabled:opacity-40"
              >
                {submitting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 mb-4 text-center">
            <p className="text-[#555] text-sm">
              <a href="/login" className="text-[#E8A838] hover:underline">Sign in</a> to post your wins, learnings, and questions.
            </p>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 animate-pulse">
                <div className="h-3 bg-[#1a1a1a] rounded w-16 mb-3" />
                <div className="h-4 bg-[#1a1a1a] rounded w-full mb-2" />
                <div className="h-4 bg-[#1a1a1a] rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-[#333] text-sm text-center py-12">No posts yet. Be the first to share something.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const cat = CATEGORY_LABELS[post.category];
              return (
                <div key={post.id} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cat.color}`}>{cat.label}</span>
                    {post.stage && <span className="text-[10px] text-[#444]">{post.stage}</span>}
                    <span className="text-[10px] text-[#333] ml-auto">{timeAgo(post.createdAt)}</span>
                  </div>
                  <p className="text-[#aaa] text-sm leading-relaxed">{post.body}</p>
                  <div className="flex gap-3 mt-3">
                    {(["fire", "clap", "think"] as const).map((r) => {
                      const emoji = r === "fire" ? "🔥" : r === "clap" ? "👏" : "🤔";
                      const key = `${post.id}:${r}`;
                      return (
                        <button
                          key={r}
                          onClick={() => react(post.id, r)}
                          className={`flex items-center gap-1 text-xs transition ${reacted.has(key) ? "text-white" : "text-[#444] hover:text-[#888]"}`}
                        >
                          <span>{emoji}</span>
                          <span>{post.reactions[r] || ""}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
