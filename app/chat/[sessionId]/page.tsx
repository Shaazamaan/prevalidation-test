import { notFound } from "next/navigation";
import { getSession } from "@/lib/db";
import QuestionnaireInterface from "@/components/QuestionnaireInterface";
import ReportDisplay from "@/components/ReportDisplay";
import { getReport } from "@/lib/db";

export default async function ChatPage({ params }: { params: { sessionId: string } }) {
  const session = await getSession(params.sessionId);
  if (!session) notFound();

  if (session.status === "completed") {
    const report = await getReport(params.sessionId);
    if (report) {
      return (
        <ReportDisplay
          report={{
            verdict: report.verdict,
            verdictExplanation: report.verdictExplanation,
            mustResolveBeforeValidation: report.mustResolveBeforeValidation,
            killSignals: report.killSignals,
            finalSummary: report.finalSummary,
          }}
          founderName={session.founderName}
          sessionId={params.sessionId}
        />
      );
    }
  }

  return (
    <QuestionnaireInterface
      sessionId={params.sessionId}
      founderName={session.founderName}
      startupIdea={session.startupIdea}
    />
  );
}
