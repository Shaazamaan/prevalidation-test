import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getAllBlogPosts, saveBlogPost, deleteBlogPost, getBlogPost } from "@/lib/db";
import type { BlogPost } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const posts = await getAllBlogPosts();
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as Partial<BlogPost>;
  if (!body.title?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }
  const slug = (body.slug ?? body.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const now = Date.now();
  const post: BlogPost = {
    slug,
    title: body.title.trim(),
    summary: body.summary?.trim() ?? body.content.slice(0, 150).trim() + "…",
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

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as Partial<BlogPost> & { slug: string };
  if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  const existing = await getBlogPost(body.slug);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = { ...existing, ...body, slug: existing.slug, updatedAt: Date.now() };
  await saveBlogPost(updated);
  return NextResponse.json({ post: updated });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await req.json() as { slug: string };
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  await deleteBlogPost(slug);
  return NextResponse.json({ success: true });
}
