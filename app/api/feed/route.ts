import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFeedPosts, createFeedPost, reactToPost, completeOnboardingStep, checkAndAwardAchievements, type FeedPost } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

const RATE_KEY_TTL = 3600; // 1 hr
const MAX_POSTS_PER_HOUR = 5;

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "30");
  const posts = await getFeedPosts(Math.min(limit, 50));
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Sign in to post" }, { status: 401 });

  const body = await req.json() as { body?: string; category?: string; stage?: string; reaction?: { postId: string; type: string } };

  // Handle reaction
  if (body.reaction) {
    const { postId, type } = body.reaction;
    if (!["fire", "clap", "think"].includes(type)) {
      return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
    }
    await reactToPost(postId, type as "fire" | "clap" | "think");
    return NextResponse.json({ success: true });
  }

  if (!body.body?.trim()) return NextResponse.json({ error: "Post body required" }, { status: 400 });
  if (body.body.trim().length > 280) return NextResponse.json({ error: "Max 280 characters" }, { status: 400 });

  const VALID_CATEGORIES = ["win", "learning", "question", "milestone"];
  if (!VALID_CATEGORIES.includes(body.category ?? "")) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const post: FeedPost = {
    id: uuidv4(),
    body: body.body.trim(),
    category: body.category as FeedPost["category"],
    stage: body.stage?.trim() || undefined,
    reactions: { fire: 0, clap: 0, think: 0 },
    createdAt: Date.now(),
  };

  await createFeedPost(post);
  completeOnboardingStep(session.user.email!, "joined_feed").catch(() => {});
  checkAndAwardAchievements(session.user.email!, { action: "community_post" }).catch(() => {});
  return NextResponse.json({ post });
}
