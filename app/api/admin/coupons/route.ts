import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  createAdminCoupon,
  getAllAdminCoupons,
  revokeAdminCoupon,
  getAdminCoupon,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const coupons = await getAllAdminCoupons();
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as {
    code?: string;
    name?: string;
    discount?: number;
    maxUses?: number | null;
    expiresAt?: number | null;
    forAgent?: string;
  };

  const code = body.code?.trim().toUpperCase() ?? "";
  if (!code || !body.name?.trim() || !body.discount) {
    return NextResponse.json({ error: "code, name, discount required" }, { status: 400 });
  }
  if (body.discount < 1 || body.discount > 99) {
    return NextResponse.json({ error: "Discount must be 1–99%" }, { status: 400 });
  }
  if (code.startsWith("REF5-") || code === "FREE" || code.startsWith("FREE_")) {
    return NextResponse.json({ error: "Code prefix is reserved" }, { status: 400 });
  }

  const existing = await getAdminCoupon(code);
  if (existing) return NextResponse.json({ error: "Code already exists" }, { status: 409 });

  await createAdminCoupon({
    code,
    name: body.name.trim(),
    discount: body.discount,
    maxUses: body.maxUses ?? null,
    createdAt: Date.now(),
    expiresAt: body.expiresAt ?? null,
    forAgent: body.forAgent?.toLowerCase() || undefined,
  });

  return NextResponse.json({ success: true, code });
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as { code?: string; action?: string };
  if (!body.code || body.action !== "revoke") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await revokeAdminCoupon(body.code.trim().toUpperCase());
  return NextResponse.json({ success: true });
}
