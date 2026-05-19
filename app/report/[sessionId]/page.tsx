import { notFound } from "next/navigation";
import { getReport, getSession } from "@/lib/db";
import ReportDisplay from "@/components/ReportDisplay";

export default async function ReportPage({ params }: { params: { sessionId: string } }) {
  const [report, session] = await Promise.all([
    getReport(params.sessionId),
    getSession(params.sessionId),
  ]);

  if (!report || !session) notFound();

  const founderReport = {
    verdict: report.verdict,
    verdictExplanation: report.verdictExplanation,
    mustResolveBeforeValidation: report.mustResolveBeforeValidation,
    killSignals: report.killSignals,
    finalSummary: report.finalSummary,
  };

  return (
    <ReportDisplay
      report={founderReport}
      founderName={session.founderName}
      sessionId={params.sessionId}
    />
  );
}
