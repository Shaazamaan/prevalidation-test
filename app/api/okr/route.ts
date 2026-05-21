import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOKRs, saveOKR, type OKREntry } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const okrs = await getOKRs(session.user.email);
  return NextResponse.json({ okrs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    quarter?: string;
    objective?: string;
    keyResults?: { text: string; progress: number }[];
  };

  if (!body.quarter || !body.objective) {
    return NextResponse.json({ error: "quarter and objective are required" }, { status: 400 });
  }

  const entry: OKREntry = {
    quarter: body.quarter,
    objective: body.objective.slice(0, 100),
    keyResults: (body.keyResults ?? []).slice(0, 3).map((kr) => ({
      text: kr.text ?? "",
      progress: Math.min(100, Math.max(0, Number(kr.progress) || 0)),
    })),
    savedAt: Date.now(),
  };

  await saveOKR(session.user.email, entry);
  return NextResponse.json({ entry });
}
