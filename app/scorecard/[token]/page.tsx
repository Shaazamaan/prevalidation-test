import { notFound } from "next/navigation";
import { getShareToken, getSession, getReport } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";

type Props = { params: { token: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getShareToken(params.token);
  if (!data) return { title: "Report — Devbridge" };
  return {
    title: `${data.founderName}'s Readiness Report — Devbridge`,
    description: `Startup readiness evaluation for ${data.startupIdea.slice(0, 120)}`,
    openGraph: {
      title: `${data.founderName}'s Devbridge Readiness Report`,
      description: data.startupIdea.slice(0, 160),
    },
  };
}

function verdictColor(v: string) {
  if (v === "READY") return "text-green-400";
  if (v === "CONDITIONALLY READY") return "text-[#E8A838]";
  return "text-red-400";
}

function scoreBar(score: number) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-[#E8A838]" : "bg-red-500";
  return (
    <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function ScorecardPage({ params }: Props) {
  const data = await getShareToken(params.token);
  if (!data) notFound();

  const [s, report] = await Promise.all([
    getSession(data.sessionId),
    getReport(data.sessionId),
  ]);

  if (!s || !report) notFound();

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-12 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        {/* Card header */}
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 mb-4 text-center">
          <p className="text-[#444] text-xs uppercase tracking-widest mb-3">Devbridge Startup Scorecard</p>
          <div className={`font-crimson text-6xl font-semibold mb-1 ${verdictColor(report.verdict)}`}>
            {report.realityScore}<span className="text-2xl text-[#333]">/100</span>
          </div>
          <p className={`text-sm font-medium mb-4 ${verdictColor(report.verdict)}`}>{report.verdict}</p>
          <p className="text-white font-medium">{s.founderName}</p>
          <p className="text-[#555] text-xs mt-0.5">{s.startupIdea.slice(0, 100)}</p>
        </div>

        {/* Phase scores */}
        {report.phaseScores && report.phaseScores.length > 0 && (
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5 mb-4">
            <p className="text-xs text-[#444] uppercase tracking-widest mb-4">Phase Scores</p>
            <div className="space-y-3">
              {report.phaseScores.map((ph: { phase: string; score: number }, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#666]">{ph.phase}</span>
                    <span className="text-[#888]">{ph.score}/100</span>
                  </div>
                  {scoreBar(ph.score)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5 mb-6">
          <p className="text-xs text-[#444] uppercase tracking-widest mb-2">Evaluator&apos;s Summary</p>
          <p className="text-[#888] text-sm leading-relaxed">{report.finalSummary}</p>
        </div>

        {/* Watermark / CTA */}
        <div className="text-center space-y-2">
          <p className="text-[#333] text-xs">Evaluated by Devbridge · Valid 30 days from issue</p>
          <Link href="/" className="inline-block text-xs text-[#E8A838] hover:underline">
            Evaluate your own startup →
          </Link>
        </div>
      </div>
    </main>
  );
}
