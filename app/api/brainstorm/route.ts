import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBrainstorm, saveBrainstorm } from "@/lib/db";
import type { BrainstormDoc } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await getBrainstorm(session.user.email);
  return NextResponse.json({ doc: doc ?? { email: session.user.email, notes: "", todos: [], updatedAt: 0 } });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Partial<BrainstormDoc>;
  const existing = await getBrainstorm(session.user.email);
  const updated: BrainstormDoc = {
    email: session.user.email,
    notes: body.notes ?? existing?.notes ?? "",
    todos: body.todos ?? existing?.todos ?? [],
    updatedAt: Date.now(),
  };
  await saveBrainstorm(updated);
  return NextResponse.json({ doc: updated });
}
