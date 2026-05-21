import { NextRequest, NextResponse } from "next/server";
import { isAdminServer } from "@/lib/admin-auth";
import { getAllFeatureFlags, setFeatureFlag, type FeatureFlag } from "@/lib/db";

export async function GET() {
  if (!isAdminServer()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const flags = await getAllFeatureFlags();
  return NextResponse.json(flags);
}

export async function POST(req: NextRequest) {
  if (!isAdminServer()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { flag, enabled } = await req.json() as { flag: string; enabled: boolean };
  if (!flag || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  await setFeatureFlag(flag as FeatureFlag, enabled);
  return NextResponse.json({ success: true, flag, enabled });
}
