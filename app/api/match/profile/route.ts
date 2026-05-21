import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMatchProfile, saveMatchProfile, completeOnboardingStep } from "@/lib/db";
import type { MatchProfile } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getMatchProfile(session.user.email);
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Partial<MatchProfile>;
  if (!body.startupName?.trim() || !body.bio?.trim()) {
    return NextResponse.json({ error: "startupName and bio are required" }, { status: 400 });
  }

  const existing = await getMatchProfile(session.user.email);
  const profile: MatchProfile = {
    email: session.user.email.toLowerCase(),
    displayName: body.displayName?.trim() ?? session.user.name ?? session.user.email,
    startupName: body.startupName.trim(),
    stage: body.stage ?? "idea",
    lookingFor: body.lookingFor ?? [],
    skills: body.skills ?? [],
    bio: body.bio.trim(),
    location: body.location?.trim() ?? "",
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    active: body.active !== false,
  };
  await saveMatchProfile(profile);
  completeOnboardingStep(session.user.email!, "set_match_profile").catch(() => {});
  return NextResponse.json({ profile });
}
