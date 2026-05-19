import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  createSession,
  getSession,
  hashIP,
  getRateLimitCount,
  incrementRateLimit,
} from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { founderName, startupIdea } = await req.json();
    if (!founderName || !startupIdea) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const ipHash = await hashIP(ip);

    const count = await getRateLimitCount(ipHash);
    if (count >= 5) {
      return NextResponse.json(
        { error: "Rate limit: 5 sessions per hour." },
        { status: 429 }
      );
    }

    await incrementRateLimit(ipHash);

    const id = uuidv4();
    await createSession({
      id,
      founderName,
      startupIdea,
      messages: [],
      status: "active",
      createdAt: Date.now(),
      ipHash,
    });

    return NextResponse.json({ sessionId: id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const session = await getSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(session);
}
