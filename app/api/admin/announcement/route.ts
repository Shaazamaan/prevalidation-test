import { NextRequest, NextResponse } from "next/server";
import { isAdminServer } from "@/lib/admin-auth";
import { getAnnouncement, setAnnouncement, clearAnnouncement } from "@/lib/db";

export async function GET() {
  if (!await isAdminServer()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ann = await getAnnouncement();
  return NextResponse.json(ann ?? null);
}

export async function POST(req: NextRequest) {
  if (!await isAdminServer()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { message, type, clear } = await req.json() as { message?: string; type?: string; clear?: boolean };
  if (clear) {
    await clearAnnouncement();
    return NextResponse.json({ ok: true, cleared: true });
  }
  if (!message?.trim()) return NextResponse.json({ error: "message required" }, { status: 400 });
  const announcementType = (["info", "warning", "success"].includes(type ?? "") ? type : "info") as "info" | "warning" | "success";
  await setAnnouncement(message.trim(), announcementType);
  return NextResponse.json({ ok: true });
}
