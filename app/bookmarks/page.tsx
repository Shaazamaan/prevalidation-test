import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getBookmarks, getBlogPost, type BlogPost } from "@/lib/db";

function readingTime(content: string): number {
  return Math.max(1, Math.ceil(content.split(" ").length / 200));
}

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const slugs = await getBookmarks(session.user.email);
  const posts = (
    await Promise.all(slugs.map((s) => getBlogPost(s).catch(() => null)))
  ).filter(Boolean) as BlogPost[];

  // Sort by publishedAt desc
  posts.sort((a, b) => b.publishedAt - a.publishedAt);

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-20 pt-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/insights" className="text-[#555] hover:text-white text-sm transition block mb-8">
          &larr; Back to Insights
        </Link>

        <div className="flex items-center justify-between mb-2">
          <h1 className="font-crimson text-3xl sm:text-4xl font-semibold text-white">Bookmarks</h1>
          {posts.length > 0 && (
            <span className="text-[#444] text-xs">{posts.length} saved</span>
          )}
        </div>
        <p className="text-[#555] text-sm mb-10">Articles you&apos;ve saved for later.</p>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4 text-[#333]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto">
                <path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z" />
              </svg>
            </div>
            <p className="text-[#444] text-sm mb-4">You haven&apos;t bookmarked any articles yet.</p>
            <p className="text-[#333] text-xs mb-6">Browse Insights to save articles for later.</p>
            <Link
              href="/insights"
              className="inline-block bg-[#E8A838] text-black text-xs font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
            >
              Browse Insights
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
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
                    {/* Filled bookmark indicator */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#E8A838">
                      <path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z" />
                    </svg>
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
