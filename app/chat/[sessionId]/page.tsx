import { notFound } from "next/navigation";
import { getSession } from "@/lib/db";
import ChatInterface from "@/components/ChatInterface";

export default async function ChatPage({ params }: { params: { sessionId: string } }) {
  const session = await getSession(params.sessionId);
  if (!session) notFound();

  return (
    <ChatInterface
      sessionId={params.sessionId}
      founderName={session.founderName}
      startupIdea={session.startupIdea}
      initialMessages={session.messages}
      isCompleted={session.status === "completed"}
    />
  );
}
