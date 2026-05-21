import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBuddyRequest, createBuddyRequest, getAllBuddyRequests, matchBuddies, type BuddyRequest } from "@/lib/db";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "shaazamaanshaji@gmail.com";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [myRequest, allRequests] = await Promise.all([
    getBuddyRequest(session.user.email),
    getAllBuddyRequests(),
  ]);

  let buddyProfile: BuddyRequest | null = null;
  if (myRequest?.matchedWith) {
    buddyProfile = await getBuddyRequest(myRequest.matchedWith);
  }

  return NextResponse.json({
    myRequest,
    buddyProfile,
    totalWaiting: allRequests.length,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { action?: string } & Partial<BuddyRequest>;

  if (body.action === "withdraw") {
    // We just delete by setting a flag — in practice, re-check and skip in getAllBuddyRequests
    // Since db doesn't have delete, we'll overwrite with matchedWith = "withdrawn"
    const existing = await getBuddyRequest(session.user.email);
    if (existing) {
      await matchBuddies(session.user.email, "withdrawn");
    }
    return NextResponse.json({ success: true });
  }

  if (!body.name?.trim() || !body.stage?.trim() || !body.sector?.trim() || !body.lookingFor?.trim()) {
    return NextResponse.json({ error: "Name, stage, sector, and lookingFor are required" }, { status: 400 });
  }

  const request = await createBuddyRequest({
    email: session.user.email,
    name: body.name.trim(),
    stage: body.stage.trim(),
    sector: body.sector.trim(),
    lookingFor: body.lookingFor.trim(),
    bio: body.bio?.trim() ?? "",
  });

  return NextResponse.json({ request });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { emailA, emailB } = await req.json() as { emailA?: string; emailB?: string };
  if (!emailA || !emailB) return NextResponse.json({ error: "Both emails required" }, { status: 400 });

  await matchBuddies(emailA, emailB);
  return NextResponse.json({ success: true });
}
