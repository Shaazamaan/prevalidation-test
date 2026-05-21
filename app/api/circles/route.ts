import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllFounderCircles, joinFounderCircle, createFounderCircle, type FounderCircle } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const circles = await getAllFounderCircles();
  return NextResponse.json({ circles });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { circleId?: string } & Partial<FounderCircle>;

  // Create a new circle
  if (body.name) {
    if (!body.name.trim() || !body.sector || !body.stage) {
      return NextResponse.json({ error: "Name, sector, stage required" }, { status: 400 });
    }
    const circle = await createFounderCircle({
      name: body.name.trim(),
      sector: body.sector,
      stage: body.stage,
      maxMembers: body.maxMembers ?? 8,
    });
    return NextResponse.json({ circle });
  }

  // User: join a circle
  if (!body.circleId) return NextResponse.json({ error: "circleId required" }, { status: 400 });
  const success = await joinFounderCircle(body.circleId, session.user.email);
  if (!success) return NextResponse.json({ error: "Circle is full or does not exist" }, { status: 409 });
  return NextResponse.json({ success: true });
}
