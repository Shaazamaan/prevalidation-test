import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getSession, getReport } from "@/lib/db";
import SessionDetail from "@/components/SessionDetail";

export default async function AdminSessionPage({ params }: { params: { id: string } }) {
  const authSession = await auth();
  if (!authSession?.user) redirect("/admin");

  const [session, report] = await Promise.all([
    getSession(params.id),
    getReport(params.id),
  ]);

  if (!session) notFound();

  return <SessionDetail session={session} report={report} />;
}
