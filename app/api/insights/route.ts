import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getAllBlogPosts, saveBlogPost } from "@/lib/db";
import type { BlogPost } from "@/lib/db";

export async function GET() {
  const posts = await getAllBlogPosts();
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Partial<BlogPost>;
  if (!body.title?.trim() || !body.content?.trim() || !body.slug?.trim()) {
    return NextResponse.json({ error: "title, slug, and content are required" }, { status: 400 });
  }

  const slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  const now = Date.now();
  const post: BlogPost = {
    slug,
    title: body.title.trim(),
    summary: body.summary?.trim() ?? body.content.slice(0, 150).trim(),
    content: body.content.trim(),
    publishedAt: now,
    updatedAt: now,
    views: 0,
    tags: body.tags ?? [],
    seoTitle: body.seoTitle?.trim(),
    seoDescription: body.seoDescription?.trim(),
  };
  await saveBlogPost(post);
  return NextResponse.json({ post });
}
