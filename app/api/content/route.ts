import { NextRequest, NextResponse } from "next/server";
import { getContentItems } from "@/lib/db";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") as "tip" | "idea" | undefined;
  const items = await getContentItems(type ?? undefined);
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return NextResponse.json({ items: shuffled.slice(0, 10) });
}
