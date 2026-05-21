import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgent, createAgentProfile } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const email = session.user.email.toLowerCase();
  const existing = await getAgent(email);
  if (existing) {
    return NextResponse.json({ error: "Already registered", status: existing.status }, { status: 409 });
  }

  const body = await req.json() as { name?: string; phone?: string; bio?: string };
  const name = body.name?.trim() || session.user.name || "";
  const phone = body.phone?.trim() ?? "";

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const profile = await createAgentProfile({
    email,
    name,
    phone,
    bio: body.bio?.trim(),
  });

  return NextResponse.json({ success: true, status: profile.status });
}
