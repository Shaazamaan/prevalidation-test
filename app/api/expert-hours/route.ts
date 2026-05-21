import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllExpertSlots, saveExpertSlot } from "@/lib/db";

export async function GET() {
  const slots = await getAllExpertSlots();
  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Sign in to list yourself" }, { status: 401 });

  const body = await req.json() as {
    expertName?: string;
    bio?: string;
    expertise?: string[];
    bookingUrl?: string;
    feePaise?: number;
  };

  if (!body.expertName?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!body.bio?.trim()) return NextResponse.json({ error: "Bio required" }, { status: 400 });
  if (!body.bookingUrl?.trim()) return NextResponse.json({ error: "Booking URL required" }, { status: 400 });

  const slot = await saveExpertSlot({
    expertEmail: session.user.email,
    expertName: body.expertName.trim(),
    bio: body.bio.trim(),
    expertise: (body.expertise ?? []).slice(0, 8),
    bookingUrl: body.bookingUrl.trim(),
    feePaise: typeof body.feePaise === "number" && body.feePaise >= 0 ? body.feePaise : 0,
    active: true,
  });

  return NextResponse.json({ slot });
}
