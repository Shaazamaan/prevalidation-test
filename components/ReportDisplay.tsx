"use client";

type FounderReport = {
  verdict: "READY" | "CONDITIONALLY READY" | "NOT READY";
  verdictExplanation: string;
  mustResolveBeforeValidation: string[];
  killSignals: string[];
  finalSummary: string;
};

type Props = {
  report: FounderReport;
  founderName: string;
  sessionId: string;
};

const VERDICT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  READY: { bg: "bg-green-900/30", text: "text-green-400", border: "border-green-800" },
  "CONDITIONALLY READY": { bg: "bg-amber-900/30", text: "text-amber-400", border: "border-amber-800" },
  "NOT READY": { bg: "bg-red-900/30", text: "text-red-400", border: "border-red-800" },
};

export default function ReportDisplay({ report, founderName, sessionId }: Props) {
  const style = VERDICT_STYLES[report.verdict] ?? VERDICT_STYLES["NOT READY"];

  const handleExport = () => {
    window.location.href = `/api/export?sessionId=${sessionId}`;
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-crimson text-3xl font-semibold text-white mb-1">
            Your Readiness Report
          </h1>
          <p className="text-[#666] text-sm">{founderName}</p>
        </div>

        {/* Verdict */}
        <div className={`${style.bg} border ${style.border} rounded-xl p-6 mb-6 text-center`}>
          <div className={`text-xl font-bold ${style.text} mb-2`}>{report.verdict}</div>
          <p className="text-[#bbb] text-sm leading-relaxed">{report.verdictExplanation}</p>
        </div>

        {/* Final Summary */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 mb-6">
          <h2 className="font-crimson text-lg font-semibold text-white mb-3">Assessment</h2>
          <p className="text-[#bbb] text-sm leading-relaxed">{report.finalSummary}</p>
        </div>

        {/* Must Resolve */}
        {report.mustResolveBeforeValidation.length > 0 && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 mb-6">
            <h2 className="font-crimson text-lg font-semibold text-white mb-3">
              Resolve Before Validation
            </h2>
            <ul className="space-y-2">
              {report.mustResolveBeforeValidation.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#bbb]">
                  <span className="text-[#E8A838] shrink-0">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Kill Signals */}
        {report.killSignals.length > 0 && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 mb-8">
            <h2 className="font-crimson text-lg font-semibold text-white mb-3">
              Kill Signals to Watch During Validation
            </h2>
            <ul className="space-y-2">
              {report.killSignals.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#bbb]">
                  <span className="text-red-400 shrink-0">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleExport}
          className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-lg text-sm hover:bg-[#d4962e] transition"
        >
          Download My Report (PDF)
        </button>

        <div className="mt-8 text-center">
          <a href="/" className="text-xs text-[#555] hover:text-[#888] transition">
            Start a new session →
          </a>
        </div>
      </div>
    </main>
  );
}
