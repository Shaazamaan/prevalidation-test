import { notFound } from "next/navigation";
import { getPitchDeckSession } from "@/lib/db";
import Link from "next/link";
import ShareBar, { StickyShareBar } from "@/components/ShareBar";
import BackToTop from "@/components/BackToTop";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const s = await getPitchDeckSession(params.id);
  if (!s) return {};
  return {
    title: `Pitch Deck Report — ${s.founderName ?? "Founder"} | Devbridge`,
    description: `Pitch deck analysis. DB Score: ${s.dbScore}/100. GR Score: ${s.grScore}/100. Verdict: ${s.overallVerdict}.`,
  };
}

type PDReport = {
  track?: string;
  trackLabel?: string;
  dbScore: number;
  grScore: number;
  overallVerdict: string;
  grantVerdict?: string;
  executiveSummary?: string;
  investmentDimensions?: { dimension: string; score: number; assessment: string; fix: string }[];
  grantDimensions?: { dimension: string; score: number; assessment: string; fix: string }[];
  topStrengths?: { strength: string; evidence: string }[];
  criticalWeaknesses?: { weakness: string; impact: string; fix: string }[];
  missingSlides?: string[];
  investorReadiness?: { readyFor?: string[]; notReadyFor?: string[]; timeline?: string };
  suggestedGrantTypes?: { grantType: string; rationale: string; examples: string }[];
  nextSteps?: { action: string; priority: string; timeline: string }[];
  finalMessage?: string;
};

const VERDICT_STYLE: Record<string, string> = {
  "FUNDABLE": "text-green-400 border-green-800 bg-green-900/20",
  "CONDITIONALLY FUNDABLE": "text-amber-400 border-amber-800 bg-amber-900/20",
  "NOT FUNDABLE": "text-red-400 border-red-800 bg-red-900/20",
  "GRANT READY": "text-blue-400 border-blue-800 bg-blue-900/20",
  "CONDITIONALLY GRANT READY": "text-purple-400 border-purple-800 bg-purple-900/20",
  "NOT GRANT READY": "text-orange-400 border-orange-800 bg-orange-900/20",
};

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#222] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[#888] w-8 text-right">{score}/{max}</span>
    </div>
  );
}

export default async function PitchDeckReportPage({ params }: { params: { id: string } }) {
  const session = await getPitchDeckSession(params.id);
  if (!session) notFound();

  const report = session.report as unknown as PDReport;
  const invStyle = VERDICT_STYLE[report.overallVerdict] ?? "";
  const grStyle = VERDICT_STYLE[report.grantVerdict ?? ""] ?? "";

  const EXPIRY_MS = 90 * 24 * 60 * 60 * 1000;
  const expiresAt = session.createdAt + EXPIRY_MS;
  const daysLeft = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
  const expiringSoon = daysLeft <= 14;

  const reportPath = `/pitch-deck/report/${session.id}`;

  return (
    <main className="min-h-screen bg-[#0a0a0a] py-10 px-4 print:bg-white print:py-6">
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          a[href]:after { content: none !important; }
          .bg-\\[\\#0a0a0a\\], .bg-\\[\\#111\\], .bg-\\[\\#0d0d0d\\] { background: #f8f8f8 !important; }
          .border-\\[\\#222\\], .border-\\[\\#1a1a1a\\] { border-color: #ddd !important; }
          .text-white { color: #111 !important; }
          .text-\\[\\#ccc\\], .text-\\[\\#888\\], .text-\\[\\#666\\], .text-\\[\\#555\\] { color: #333 !important; }
          .text-\\[\\#444\\] { color: #666 !important; }
        }
      `}</style>
      <div className="max-w-2xl mx-auto pb-16 sm:pb-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/" className="text-[#555] text-sm hover:text-[#E8A838] transition">← Devbridge</Link>
          <div className="flex items-center gap-3">
            <p className="text-[#444] text-xs">{new Date(session.createdAt).toLocaleDateString()}</p>
            <ShareBar path={reportPath} title={`${session.founderName ?? "Founder"}'s Pitch Deck Analysis`} score={`DB ${report.dbScore}/GR ${report.grScore}`} />
          </div>
        </div>
        <div className="hidden print:flex items-center justify-between mb-6">
          <p className="text-[#888] text-xs font-medium">devbridgekerala.com</p>
          <p className="text-[#888] text-xs">{new Date(session.createdAt).toLocaleDateString()}</p>
        </div>

        {expiringSoon && (
          <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl px-4 py-3 mb-5 print:hidden">
            <p className="text-amber-400 text-xs">This report expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""} · <a href="/" className="underline">Get a new evaluation</a></p>
          </div>
        )}

        <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-2">Pitch Deck Analysis</p>
        {session.founderName && <h1 className="font-crimson text-3xl text-white mb-1">{session.founderName}</h1>}
        {session.country && <p className="text-[#555] text-sm mb-1">{session.country}</p>}
        {report.trackLabel && (
          <p className="text-[#666] text-sm mb-6">Track: {report.trackLabel}</p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className={`border rounded-xl p-4 ${invStyle}`}>
            <p className="text-xs uppercase mb-1 opacity-70">DB Score</p>
            <p className="text-3xl font-bold">{report.dbScore}</p>
            <p className="text-xs opacity-70">/100</p>
            <p className="text-xs mt-2 font-medium">{report.overallVerdict}</p>
          </div>
          <div className={`border rounded-xl p-4 ${grStyle}`}>
            <p className="text-xs uppercase mb-1 opacity-70">GR Score</p>
            <p className="text-3xl font-bold">{report.grScore}</p>
            <p className="text-xs opacity-70">/100</p>
            <p className="text-xs mt-2 font-medium">{report.grantVerdict}</p>
          </div>
        </div>

        {report.executiveSummary && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 mb-5">
            <p className="text-xs text-[#555] uppercase mb-2">Executive Summary</p>
            <p className="text-[#ccc] text-sm leading-relaxed">{report.executiveSummary}</p>
          </div>
        )}

        {(report.investmentDimensions?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-white font-semibold mb-3">Investment Dimensions</h2>
            <div className="space-y-3">
              {report.investmentDimensions!.map((d) => (
                <div key={d.dimension} className="bg-[#111] border border-[#222] rounded-lg p-3">
                  <p className="text-white text-sm font-medium mb-1.5">{d.dimension}</p>
                  <ScoreBar score={d.score} />
                  <p className="text-[#666] text-xs mt-2">{d.assessment}</p>
                  {d.fix && <p className="text-[#E8A838] text-xs mt-1">→ {d.fix}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {(report.grantDimensions?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-white font-semibold mb-3">Grant Dimensions</h2>
            <div className="space-y-3">
              {report.grantDimensions!.map((d) => (
                <div key={d.dimension} className="bg-[#111] border border-[#222] rounded-lg p-3">
                  <p className="text-white text-sm font-medium mb-1.5">{d.dimension}</p>
                  <ScoreBar score={d.score} />
                  <p className="text-[#666] text-xs mt-2">{d.assessment}</p>
                  {d.fix && <p className="text-blue-400 text-xs mt-1">→ {d.fix}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {(report.topStrengths?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-white font-semibold mb-3">Top Strengths</h2>
            {report.topStrengths!.map((s, i) => (
              <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-3 mb-2">
                <p className="text-green-400 text-sm">{s.strength}</p>
                <p className="text-[#555] text-xs mt-1">{s.evidence}</p>
              </div>
            ))}
          </div>
        )}

        {(report.criticalWeaknesses?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-white font-semibold mb-3">Critical Weaknesses</h2>
            {report.criticalWeaknesses!.map((w, i) => (
              <div key={i} className="bg-[#111] border border-red-900/30 rounded-lg p-3 mb-2">
                <p className="text-red-400 text-sm font-medium">{w.weakness}</p>
                <p className="text-[#666] text-xs mt-1">{w.impact}</p>
                <p className="text-[#E8A838] text-xs mt-1">→ {w.fix}</p>
              </div>
            ))}
          </div>
        )}

        {report.investorReadiness && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 mb-5">
            <h2 className="text-white font-semibold mb-3">Investor Readiness</h2>
            {(report.investorReadiness.readyFor?.length ?? 0) > 0 && (
              <div className="mb-2">
                <p className="text-xs text-green-400 uppercase mb-1">Ready For</p>
                {report.investorReadiness.readyFor!.map((r, i) => <p key={i} className="text-[#888] text-xs">▸ {r}</p>)}
              </div>
            )}
            {(report.investorReadiness.notReadyFor?.length ?? 0) > 0 && (
              <div className="mb-2">
                <p className="text-xs text-red-400 uppercase mb-1">Not Yet Ready For</p>
                {report.investorReadiness.notReadyFor!.map((r, i) => <p key={i} className="text-[#888] text-xs">▾ {r}</p>)}
              </div>
            )}
            {report.investorReadiness.timeline && (
              <p className="text-[#E8A838] text-xs mt-2">{report.investorReadiness.timeline}</p>
            )}
          </div>
        )}

        {(report.suggestedGrantTypes?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-white font-semibold mb-3">Suggested Grant Types</h2>
            {report.suggestedGrantTypes!.map((g, i) => (
              <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-3 mb-2">
                <p className="text-blue-400 text-sm font-medium">{g.grantType}</p>
                <p className="text-[#666] text-xs mt-1">{g.rationale}</p>
                <p className="text-[#555] text-xs mt-1">{g.examples}</p>
              </div>
            ))}
          </div>
        )}

        {(report.nextSteps?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-white font-semibold mb-3">Next Steps</h2>
            {report.nextSteps!.map((s, i) => (
              <div key={i} className="flex items-start gap-3 bg-[#111] border border-[#222] rounded-lg p-3 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded border shrink-0 mt-0.5 ${
                  s.priority === "CRITICAL" ? "border-red-800 text-red-400" :
                  s.priority === "HIGH" ? "border-amber-800 text-amber-400" : "border-[#333] text-[#666]"
                }`}>{s.priority}</span>
                <div>
                  <p className="text-white text-sm">{s.action}</p>
                  <p className="text-[#555] text-xs mt-1">{s.timeline}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {report.finalMessage && (
          <div className="bg-[#E8A838]/10 border border-[#E8A838]/30 rounded-xl p-5 mb-6">
            <p className="text-xs text-[#E8A838] uppercase tracking-wide mb-2">From Devbridge</p>
            <p className="text-[#ccc] text-sm leading-relaxed">{report.finalMessage}</p>
          </div>
        )}

        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 mb-6">
          <p className="text-xs text-[#444] leading-relaxed">
            This report is AI-generated by Devbridge for informational purposes only. It does not constitute financial, legal, or investment advice.
          </p>
        </div>

        <div className="flex justify-center print:hidden">
          <Link href="/" className="bg-[#E8A838] text-black font-semibold px-6 py-3 rounded-xl text-sm hover:bg-[#d4962e] transition">
            Get Your Own Evaluation →
          </Link>
        </div>

        <p className="hidden print:block text-center text-xs text-[#666] mt-6">
          Generated by Devbridge · devbridgekerala.com · AI-generated advisory only
        </p>
      </div>
      <BackToTop />
      <StickyShareBar path={reportPath} title={`${session.founderName ?? "Founder"}'s Pitch Deck Analysis`} />
    </main>
  );
}
