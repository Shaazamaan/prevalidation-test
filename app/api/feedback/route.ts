import { NextRequest, NextResponse } from "next/server";
import { saveFeedback, getAllFeedback, resolveFeedback } from "@/lib/db";
import { isAdminServer } from "@/lib/admin-auth";

export async function GET() {
  if (!isAdminServer()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entries = await getAllFeedback();
  return NextResponse.json(entries);
}

export async function PATCH(req: NextRequest) {
  if (!isAdminServer()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await resolveFeedback(id);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    type?: string;
    body?: string;
    page?: string;
    email?: string;
  };

  if (!body.type || !["bug", "feature", "other"].includes(body.type)) {
    return NextResponse.json({ error: "type must be bug | feature | other" }, { status: 400 });
  }
  if (!body.body?.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  await saveFeedback({
    type: body.type as "bug" | "feature" | "other",
    body: body.body.trim().slice(0, 500),
    page: (body.page ?? "unknown").slice(0, 200),
    submittedAt: Date.now(),
    ...(body.email ? { email: body.email.toLowerCase() } : {}),
  });

  return NextResponse.json({ ok: true });
}
