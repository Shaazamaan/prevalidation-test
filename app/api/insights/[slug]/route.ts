import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getBlogPost, saveBlogPost, deleteBlogPost, incrementPostViews } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await incrementPostViews(params.slug);
  return NextResponse.json({ post: { ...post, views: post.views + 1 } });
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const post = await getBlogPost(params.slug);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const updated = { ...post, ...body, slug: post.slug, updatedAt: Date.now() };
  await saveBlogPost(updated);
  return NextResponse.json({ post: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteBlogPost(params.slug);
  return NextResponse.json({ success: true });
}
