import { NextResponse } from "next/server";
import { isAdminServer } from "@/lib/admin-auth";
import { getAuditLog } from "@/lib/db";

export async function GET() {
  if (!await isAdminServer()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const log = await getAuditLog();
  return NextResponse.json(log);
}
