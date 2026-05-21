import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { submitDemoDayEntry, getDemoDayEntries, voteDemoEntry, type DemoDayEntry } from "@/lib/db";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? currentMonth();
  const entries = await getDemoDayEntries(month);
  return NextResponse.json({ entries, month });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Partial<DemoDayEntry>;
  if (!body.startupName?.trim() || !body.oneLiner?.trim()) {
    return NextResponse.json({ error: "Startup name and one-liner required" }, { status: 400 });
  }
  if (body.oneLiner.length > 100) {
    return NextResponse.json({ error: "One-liner must be 100 characters or less" }, { status: 400 });
  }

  const month = currentMonth();
  // Check if already submitted this month
  const existing = await getDemoDayEntries(month);
  if (existing.find((e) => e.email.toLowerCase() === session.user!.email!.toLowerCase())) {
    return NextResponse.json({ error: "Already submitted for this month" }, { status: 409 });
  }

  const entry = await submitDemoDayEntry({
    email: session.user.email,
    founderName: body.founderName?.trim() ?? session.user.name ?? "Founder",
    startupName: body.startupName.trim(),
    oneLiner: body.oneLiner.trim(),
    videoUrl: body.videoUrl?.trim(),
    readinessScore: body.readinessScore,
    month,
  });

  return NextResponse.json({ entry });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await voteDemoEntry(id, session.user.email);
  return NextResponse.json({ success: true });
}
