import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getChatMessages, getMatches } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const other = req.nextUrl.searchParams.get("with");
  if (!other) return NextResponse.json({ error: "with param required" }, { status: 400 });

  const matches = await getMatches(session.user.email);
  if (!matches.includes(other.toLowerCase())) {
    return NextResponse.json({ error: "Not a match" }, { status: 403 });
  }

  const msgs = await getChatMessages(session.user.email, other);
  const text = msgs.map((m) => `[${new Date(m.sentAt).toLocaleString("en-IN")}] ${m.from}: ${m.body}`).join("\n");

  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="chat-${other.split("@")[0]}.txt"`,
    },
  });
}
