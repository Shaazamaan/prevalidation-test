import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgent, getAgentConversations, getAgentClientMessages, sendAgentClientMessage, markAgentClientMessagesRead, getAgentEmailByCode } from "@/lib/db";

// GET: agent fetches their conversations list, or specific thread
// GET /api/agent/chat → list of conversations
// GET /api/agent/chat?with=clientEmail → thread
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agent = await getAgent(session.user.email);
  if (!agent || agent.status !== "active") return NextResponse.json({ error: "Not an active agent" }, { status: 403 });

  const withParam = req.nextUrl.searchParams.get("with");
  if (withParam) {
    const msgs = await getAgentClientMessages(session.user.email, withParam);
    await markAgentClientMessagesRead(session.user.email, withParam, session.user.email);
    return NextResponse.json({ messages: msgs });
  }

  const convs = await getAgentConversations(session.user.email);
  return NextResponse.json({ conversations: convs });
}

// POST: send a message
// Can be called by agent (session is agent email) or by client (includes agentCode param)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { agentCode?: string; clientEmail?: string; body: string };
  if (!body.body?.trim()) return NextResponse.json({ error: "body required" }, { status: 400 });

  const senderEmail = session.user.email.toLowerCase();

  // Sender is the agent
  if (body.clientEmail) {
    const agent = await getAgent(senderEmail);
    if (!agent || agent.status !== "active") return NextResponse.json({ error: "Not an active agent" }, { status: 403 });
    const msg = await sendAgentClientMessage(senderEmail, body.clientEmail, senderEmail, body.body.trim());
    return NextResponse.json({ message: msg });
  }

  // Sender is a client messaging their agent
  if (body.agentCode) {
    const agentEmail = await getAgentEmailByCode(body.agentCode.toUpperCase());
    if (!agentEmail) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    const msg = await sendAgentClientMessage(agentEmail, senderEmail, senderEmail, body.body.trim());
    return NextResponse.json({ message: msg });
  }

  return NextResponse.json({ error: "clientEmail or agentCode required" }, { status: 400 });
}
