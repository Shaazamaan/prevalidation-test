import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { recordSwipe, getSwipedEmails, getAllMatchProfiles } from "@/lib/db";

const GUEST_SWIPE_LIMIT = 5;

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json() as { targetEmail: string; direction: "like" | "pass"; guestCount?: number };

  if (!body.targetEmail || !["like", "pass"].includes(body.direction)) {
    return NextResponse.json({ error: "targetEmail and direction required" }, { status: 400 });
  }

  if (!session?.user?.email) {
    // Guest: track count client-side, limit to 5
    const count = (body.guestCount ?? 0) + 1;
    if (count > GUEST_SWIPE_LIMIT) {
      return NextResponse.json({ error: "sign_in_required", limitReached: true }, { status: 403 });
    }
    return NextResponse.json({ guestCount: count, isMatch: false });
  }

  const { isMatch } = await recordSwipe(session.user.email, body.targetEmail, body.direction);
  return NextResponse.json({ isMatch });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ profiles: [], swiped: {} });

  const [allProfiles, swiped] = await Promise.all([
    getAllMatchProfiles(),
    getSwipedEmails(session.user.email),
  ]);

  const profiles = allProfiles.filter((p) => p.email !== session.user!.email && !swiped[p.email]);
  return NextResponse.json({ profiles, swiped });
}
