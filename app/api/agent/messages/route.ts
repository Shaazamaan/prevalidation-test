import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgent, getAgentMessages, markAgentMessagesRead } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const agent = await getAgent(session.user.email);
  if (!agent || agent.status !== "active") return NextResponse.json({ error: "Not an active agent" }, { status: 403 });

  await markAgentMessagesRead(agent.email);
  const messages = await getAgentMessages(agent.email);
  return NextResponse.json({ messages });
}
