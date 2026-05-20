import { notFound } from "next/navigation";
import { getReport, getSession } from "@/lib/db";
import ReportDisplay from "@/components/ReportDisplay";

export async function generateMetadata({ params }: { params: { sessionId: string } }) {
  const session = await getSession(params.sessionId);
  if (!session) return {};
  return {
    title: `Readiness Report — ${session.founderName}`,
    description: `Startup pre-validation readiness report for ${session.founderName}.`,
  };
}

export default async function ReportPage({ params }: { params: { sessionId: string } }) {
  const [report, session] = await Promise.all([
    getReport(params.sessionId),
    getSession(params.sessionId),
  ]);

  if (!report || !session) notFound();

  return (
    <ReportDisplay
      report={report}
      founderName={session.founderName}
      sessionId={params.sessionId}
    />
  );
}
