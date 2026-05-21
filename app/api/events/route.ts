import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllPitchCompetitions, savePitchCompetition, deletePitchCompetition, type PitchCompetition } from "@/lib/db";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "shaazamaanshaji@gmail.com").toLowerCase();

export async function GET() {
  const competitions = await getAllPitchCompetitions();
  return NextResponse.json({ competitions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as Partial<PitchCompetition>;
  if (!body.name?.trim() || !body.organizer?.trim() || !body.url?.trim() || !body.deadline) {
    return NextResponse.json({ error: "Name, organizer, URL, and deadline required" }, { status: 400 });
  }

  const comp = await savePitchCompetition({
    name: body.name.trim(),
    organizer: body.organizer.trim(),
    deadline: body.deadline,
    eventDate: body.eventDate,
    prize: body.prize?.trim(),
    location: body.location?.trim() ?? "Remote",
    url: body.url.trim(),
    sector: body.sector?.trim(),
    stage: body.stage?.trim(),
  });

  return NextResponse.json({ competition: comp });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.email.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await deletePitchCompetition(id);
  return NextResponse.json({ success: true });
}
