import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addBookmark, removeBookmark, getBookmarks } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slugs = await getBookmarks(session.user.email);
  return NextResponse.json({ slugs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { slug?: string };
  if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  await addBookmark(session.user.email, body.slug);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { slug?: string };
  if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  await removeBookmark(session.user.email, body.slug);
  return NextResponse.json({ ok: true });
}
