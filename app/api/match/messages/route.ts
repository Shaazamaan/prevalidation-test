import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getChatMessages, sendChatMessage, getMatches } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const other = req.nextUrl.searchParams.get("with");
  if (!other) {
    // Return match list
    const matches = await getMatches(session.user.email);
    return NextResponse.json({ matches });
  }

  const matches = await getMatches(session.user.email);
  if (!matches.includes(other.toLowerCase())) {
    return NextResponse.json({ error: "Not a match" }, { status: 403 });
  }

  const msgs = await getChatMessages(session.user.email, other);
  return NextResponse.json({ messages: msgs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { to: string; body: string };
  if (!body.to || !body.body?.trim()) {
    return NextResponse.json({ error: "to and body required" }, { status: 400 });
  }

  const matches = await getMatches(session.user.email);
  if (!matches.includes(body.to.toLowerCase())) {
    return NextResponse.json({ error: "Not a match" }, { status: 403 });
  }

  const msg = await sendChatMessage(session.user.email, body.to, body.body.trim());
  return NextResponse.json({ message: msg });
}
