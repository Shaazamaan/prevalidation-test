import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getJournalEntries, saveJournalEntry, completeOnboardingStep, type JournalEntry } from "@/lib/db";

function getWeekKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entries = await getJournalEntries(session.user.email);
  const currentWeek = getWeekKey();
  return NextResponse.json({ entries, currentWeek });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { shipped?: string; learned?: string; blocker?: string; weekKey?: string };
  const weekKey = body.weekKey ?? getWeekKey();

  const entry: JournalEntry = {
    weekKey,
    shipped: body.shipped?.trim() ?? "",
    learned: body.learned?.trim() ?? "",
    blocker: body.blocker?.trim() ?? "",
    savedAt: Date.now(),
  };

  await saveJournalEntry(session.user.email, entry);
  completeOnboardingStep(session.user.email!, "wrote_journal").catch(() => {});
  return NextResponse.json({ entry });
}
