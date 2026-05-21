import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getScoreHistory } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const history = await getScoreHistory(session.user.email);
  return NextResponse.json({ history });
}
