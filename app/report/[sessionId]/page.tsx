import { notFound } from "next/navigation";
import { getReport, getSession } from "@/lib/db";
import { auth } from "@/auth";
import type { Metadata } from "next";
import ReportDisplay from "@/components/ReportDisplay";

export async function generateMetadata({ params }: { params: { sessionId: string } }): Promise<Metadata> {
  const [session, report] = await Promise.all([
    getSession(params.sessionId),
    getReport(params.sessionId),
  ]);
  if (!session) return {};

  const score = report?.realityScore;
  const verdict = report?.verdict ?? "";
  const verdictShort = verdict === "READY" ? "passed" : verdict === "CONDITIONALLY READY" ? "conditionally passed" : "got flagged";
  const idea = session.startupIdea?.slice(0, 80) ?? "a startup idea";

  const title = score != null
    ? `${session.founderName}'s startup scored ${score}/100 — ${verdict} · Devbridge`
    : `Readiness Report — ${session.founderName} · Devbridge`;

  const description = score != null
    ? `AI reality check on "${idea}". It ${verdictShort} with a ${score}/100 reality score. See the full breakdown — gaps, assumptions, and what to do next.`
    : `Startup pre-validation readiness report for ${session.founderName}. See the full AI analysis.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devbridgekerala.com";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/report/${params.sessionId}`,
      siteName: "Devbridge",
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ReportPage({ params }: { params: { sessionId: string } }) {
  const [report, session, authSession] = await Promise.all([
    getReport(params.sessionId),
    getSession(params.sessionId),
    auth(),
  ]);

  if (!report || !session) notFound();

  return (
    <ReportDisplay
      report={report}
      founderName={session.founderName}
      sessionId={params.sessionId}
      userEmail={authSession?.user?.email ?? undefined}
    />
  );
}
