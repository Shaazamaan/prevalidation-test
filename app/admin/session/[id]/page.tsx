import { redirect, notFound } from "next/navigation";
import { getSession, getReport } from "@/lib/db";
import { isAdminServer } from "@/lib/admin-auth";
import SessionDetail from "@/components/SessionDetail";

export default async function AdminSessionPage({ params }: { params: { id: string } }) {
  if (!isAdminServer()) redirect("/admin");

  const [session, report] = await Promise.all([
    getSession(params.id),
    getReport(params.id),
  ]);

  if (!session) notFound();

  return <SessionDetail session={session} report={report} />;
}
