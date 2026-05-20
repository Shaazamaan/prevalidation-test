import { notFound } from "next/navigation";
import { getAdvisorSession } from "@/lib/db";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const s = await getAdvisorSession(params.id);
  if (!s) return {};
  return {
    title: `Advisor Report — ${s.founderName} | Devbridge`,
    description: `Startup viability evaluation for ${s.founderName}. Pathway: ${s.pathwayLabel}. Score: ${s.overallScore}/100.`,
  };
}

const PATHWAY_COLORS: Record<string, string> = {
  "PATHWAY 1": "text-green-400 border-green-800 bg-green-900/20",
  "PATHWAY 2": "text-amber-400 border-amber-800 bg-amber-900/20",
  "PATHWAY 3": "text-blue-400 border-blue-800 bg-blue-900/20",
  "PATHWAY 4": "text-purple-400 border-purple-800 bg-purple-900/20",
  "PATHWAY 5": "text-orange-400 border-orange-800 bg-orange-900/20",
  "PATHWAY 6": "text-red-400 border-red-800 bg-red-900/20",
};

type AdvisorReport = {
  pathway: string;
  pathwayLabel: string;
  overallScore: number;
  founderReadinessScore?: number;
  ideaViabilityScore?: number;
  marketOpportunityScore?: number;
  verdict: string;
  strengths?: { area: string; insight: string }[];
  criticalGaps?: { gap: string; severity: string; fix: string }[];
  geographyInsights?: { location: string; opportunities?: string[]; risks?: string[]; fundingEcosystem?: string };
  mentalHealthFlag?: boolean;
  mentalHealthNote?: string | null;
  immediateNextSteps?: { step: string; timeline: string; priority: number }[];
  validationExperiments?: { experiment: string; successMetric: string; cost: string; timeframe: string }[];
  resourcesNeeded?: { capital?: string; skills?: string[]; time?: string };
  finalMessage: string;
};

export default async function AdvisorReportPage({ params }: { params: { id: string } }) {
  const session = await getAdvisorSession(params.id);
  if (!session) notFound();

  const report = session.report as unknown as AdvisorReport;
  const pathwayColor = PATHWAY_COLORS[report.pathway] ?? "text-[#E8A838] border-[#444] bg-[#111]";

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
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/" className="text-[#555] text-sm hover:text-[#E8A838] transition">← Devbridge</Link>
          <div className="flex items-center gap-3">
            <p className="text-[#444] text-xs">{new Date(session.createdAt).toLocaleDateString()}</p>
            <PrintButton />
          </div>
        </div>
        <div className="hidden print:flex items-center justify-between mb-6">
          <p className="text-[#888] text-xs font-medium">devbridgekerala.com</p>
          <p className="text-[#888] text-xs">{new Date(session.createdAt).toLocaleDateString()}</p>
        </div>

        <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-2">Startup Viability Report</p>
        <h1 className="font-crimson text-3xl text-white mb-1">{session.founderName}</h1>
        {session.country && <p className="text-[#555] text-sm mb-6">{session.country}</p>}

        {/* Pathway */}
        <div className={`border rounded-xl p-5 mb-5 ${pathwayColor}`}>
          <p className="text-xs uppercase tracking-widest mb-1 opacity-70">{report.pathway}</p>
          <p className="text-2xl font-crimson font-semibold">{report.pathwayLabel}</p>
          <p className="text-sm mt-2 opacity-90">{report.verdict}</p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Overall", score: report.overallScore },
            { label: "Founder", score: report.founderReadinessScore },
            { label: "Idea", score: report.ideaViabilityScore },
            { label: "Market", score: report.marketOpportunityScore },
          ].map((s) => (
            <div key={s.label} className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
              <p className="text-[#E8A838] text-2xl font-bold">{s.score ?? "—"}</p>
              <p className="text-[#555] text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mental health flag */}
        {report.mentalHealthFlag && report.mentalHealthNote && (
          <div className="bg-orange-900/20 border border-orange-800/40 rounded-xl p-4 mb-5">
            <p className="text-orange-400 text-xs uppercase tracking-wide mb-2">Founder Wellbeing Note</p>
            <p className="text-[#ccc] text-sm">{report.mentalHealthNote}</p>
          </div>
        )}

        {/* Strengths */}
        {(report.strengths?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-white font-semibold mb-3">Strengths</h2>
            <div className="space-y-2">
              {report.strengths!.map((s, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-3">
                  <p className="text-green-400 text-xs uppercase mb-1">{s.area}</p>
                  <p className="text-[#888] text-sm">{s.insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical gaps */}
        {(report.criticalGaps?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-white font-semibold mb-3">Critical Gaps</h2>
            <div className="space-y-2">
              {report.criticalGaps!.map((g, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-red-400 text-xs uppercase">{g.gap}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      g.severity === "HIGH" ? "border-red-800 text-red-400" :
                      g.severity === "MEDIUM" ? "border-amber-800 text-amber-400" : "border-[#333] text-[#666]"
                    }`}>{g.severity}</span>
                  </div>
                  <p className="text-[#888] text-sm">{g.fix}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Geography */}
        {report.geographyInsights && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 mb-5">
            <h2 className="text-white text-sm font-semibold mb-2">{report.geographyInsights.location} — Local Context</h2>
            {report.geographyInsights.fundingEcosystem && (
              <p className="text-[#666] text-xs mb-2">{report.geographyInsights.fundingEcosystem}</p>
            )}
            {report.geographyInsights.opportunities?.map((o, i) => (
              <p key={i} className="text-xs text-green-400 mb-1">▸ {o}</p>
            ))}
            {report.geographyInsights.risks?.map((r, i) => (
              <p key={i} className="text-xs text-red-400 mb-1">▾ {r}</p>
            ))}
          </div>
        )}

        {/* Next steps */}
        {(report.immediateNextSteps?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-white font-semibold mb-3">Next Steps</h2>
            <div className="space-y-2">
              {report.immediateNextSteps!.sort((a, b) => a.priority - b.priority).map((s, i) => (
                <div key={i} className="flex items-start gap-3 bg-[#111] border border-[#222] rounded-lg p-3">
                  <span className="text-[#E8A838] font-bold text-sm shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-white text-sm">{s.step}</p>
                    <p className="text-[#555] text-xs mt-1">{s.timeline}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final message */}
        <div className="bg-[#E8A838]/10 border border-[#E8A838]/30 rounded-xl p-5 mb-8">
          <p className="text-xs text-[#E8A838] uppercase tracking-wide mb-2">From Devbridge</p>
          <p className="text-[#ccc] text-sm leading-relaxed">{report.finalMessage}</p>
        </div>

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
    </main>
  );
}
