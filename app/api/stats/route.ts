import { NextResponse } from "next/server";
import { getSessionCount, getAllSessions } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [count, sessions] = await Promise.all([
      getSessionCount(),
      getAllSessions(),
    ]);

    const completed = sessions.filter((s) => s.status === "completed").length;
    const active = sessions.filter((s) => s.status === "active").length;

    return NextResponse.json({ total: count, completed, active }, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json({ total: 0, completed: 0, active: 0 });
  }
}
