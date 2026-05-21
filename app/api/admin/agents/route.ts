import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  getAllAgents,
  updateAgentProfile,
  getAgentMessages,
  sendAgentMessage,
  getAgentRevenue,
  getAgentClients,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profiles = await getAllAgents();
  const agents = await Promise.all(profiles.map(async (a) => {
    const [revenue, clients, messages] = await Promise.all([
      getAgentRevenue(a.email).catch(() => 0),
      getAgentClients(a.email).catch(() => []),
      getAgentMessages(a.email).catch(() => []),
    ]);
    return { profile: a, revenue, clientCount: clients.length, clients, messages };
  }));
  return NextResponse.json({ agents });
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    email?: string;
    action?: "approve" | "ban" | "unban" | "set_sub" | "set_max_discount" | "set_notes";
    value?: unknown;
  };

  if (!body.email || !body.action) return NextResponse.json({ error: "email and action required" }, { status: 400 });
  const email = body.email.toLowerCase();

  switch (body.action) {
    case "approve":
      await updateAgentProfile(email, { status: "active", approvedAt: Date.now() });
      break;
    case "ban":
      await updateAgentProfile(email, { status: "banned", bannedAt: Date.now() });
      break;
    case "unban":
      await updateAgentProfile(email, { status: "active", bannedAt: undefined });
      break;
    case "set_sub":
      await updateAgentProfile(email, {
        subscriptionStatus: body.value === "active" ? "active" : "inactive",
        subscriptionActivatedAt: body.value === "active" ? Date.now() : undefined,
      });
      break;
    case "set_max_discount": {
      const v = Number(body.value);
      if (isNaN(v) || v < 1 || v > 40) return NextResponse.json({ error: "Max discount must be 1–40" }, { status: 400 });
      await updateAgentProfile(email, { maxCouponDiscount: v });
      break;
    }
    case "set_notes":
      await updateAgentProfile(email, { adminNotes: String(body.value ?? "") });
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { email?: string; message?: string };
  if (!body.email || !body.message?.trim()) {
    return NextResponse.json({ error: "email and message required" }, { status: 400 });
  }

  await sendAgentMessage(body.email.toLowerCase(), body.message.trim());

  const messages = await getAgentMessages(body.email.toLowerCase());
  return NextResponse.json({ success: true, messages });
}
