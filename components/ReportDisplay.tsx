"use client";

import { useState } from "react";
import type { Report } from "@/lib/db";

type Props = {
  report: Pick<
    Report,
    | "verdict"
    | "verdictExplanation"
    | "realityScore"
    | "phaseScores"
    | "contradictions"
    | "founderStressTest"
    | "projectStressTest"
    | "whatFounderDoesNotKnow"
    | "mostDangerousAssumptions"
    | "mustResolveBeforeValidation"
    | "nextSteps"
    | "killSignals"
    | "finalSummary"
  >;
  founderName: string;
  sessionId: string;
};

const VERDICT_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  READY: {
    bg: "bg-green-900/20",
    text: "text-green-400",
    border: "border-green-800/50",
    label: "You're ready to begin market validation.",
  },
  "CONDITIONALLY READY": {
    bg: "bg-amber-900/20",
    text: "text-amber-400",
    border: "border-amber-800/50",
    label: "Ready, but critical gaps must be closed first.",
  },
  "NOT READY": {
    bg: "bg-red-900/20",
    text: "text-red-400",
    border: "border-red-800/50",
    label: "Not ready. Do not begin validation yet.",
  },
};

function realityScoreColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 45) return "text-amber-400";
  return "text-red-400";
}

function phaseScoreColor(score: number): string {
  if (score >= 7) return "bg-green-500";
  if (score >= 5) return "bg-amber-500";
  return "bg-red-500";
}

function ListSection({ title, items, accent = "#E8A838" }: { title: string; items: string[]; accent?: string }) {
  if (!items?.length) return null;
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-5">
      <h3 className="text-xs text-[#555] uppercase tracking-widest mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-[#bbb] leading-relaxed">
            <span className="shrink-0 mt-0.5" style={{ color: accent }}>▸</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ReportDisplay({ report, founderName, sessionId }: Props) {
  const [copied, setCopied] = useState(false);
  const style = VERDICT_STYLES[report.verdict] ?? VERDICT_STYLES["NOT READY"];

  const handleShare = async () => {
    const url = `${window.location.origin}/report/${sessionId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt("Copy this link:", url);
    }
  };

  const handleExport = () => {
    window.location.href = `/api/export?sessionId=${sessionId}`;
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-10 sm:py-14">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Title */}
        <div className="text-center mb-2">
          <h1 className="font-crimson text-3xl sm:text-4xl font-semibold text-white mb-1">
            Readiness Report
          </h1>
          <p className="text-[#555] text-sm">{founderName}</p>
        </div>

        {/* Verdict */}
        <div className={`${style.bg} border ${style.border} rounded-xl p-6 text-center`}>
          <div className={`text-2xl font-bold ${style.text} mb-1`}>{report.verdict}</div>
          <p className="text-[#777] text-xs mb-3">{style.label}</p>
          <p className="text-[#bbb] text-sm leading-relaxed">{report.verdictExplanation}</p>
        </div>

        {/* Reality Score */}
        {typeof report.realityScore === "number" && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs text-[#555] uppercase tracking-widest">Reality Score</h3>
              <span className={`text-2xl font-bold ${realityScoreColor(report.realityScore)}`}>
                {report.realityScore}<span className="text-base text-[#555]">/100</span>
              </span>
            </div>
            <div className="w-full bg-[#1a1a1a] rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${
                  report.realityScore >= 70 ? "bg-green-500" :
                  report.realityScore >= 45 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min(report.realityScore, 100)}%` }}
              />
            </div>
            <p className="text-[#555] text-xs mt-2">
              Measures how grounded your answers are in observable facts vs. assumptions and excitement.
            </p>
          </div>
        )}

        {/* Phase Scores */}
        {report.phaseScores?.length > 0 && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-5">
            <h3 className="text-xs text-[#555] uppercase tracking-widest mb-4">Phase Scores</h3>
            <div className="space-y-2.5">
              {report.phaseScores.map((ps) => (
                <div key={ps.phase}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#888] truncate pr-2">
                      <span className="text-[#555] mr-1">{ps.phase}.</span>{ps.title}
                    </span>
                    <span className="text-xs font-semibold text-white shrink-0">{ps.score}/10</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${phaseScoreColor(ps.score)}`}
                      style={{ width: `${(ps.score / 10) * 100}%` }}
                    />
                  </div>
                  {ps.note && (
                    <p className="text-[#555] text-xs mt-0.5 leading-relaxed">{ps.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contradictions */}
        {report.contradictions?.length > 0 && (
          <div className="bg-[#111] border border-red-900/30 rounded-xl p-5">
            <h3 className="text-xs text-red-500/70 uppercase tracking-widest mb-3">Contradictions Detected</h3>
            <ul className="space-y-2">
              {report.contradictions.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#bbb] leading-relaxed">
                  <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Founder Stress Test */}
        {report.founderStressTest && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-5 space-y-4">
            <h3 className="text-xs text-[#555] uppercase tracking-widest">Founder Stress Test</h3>
            {report.founderStressTest.solid?.length > 0 && (
              <div>
                <p className="text-xs text-green-500/70 uppercase mb-2">Solid</p>
                <ul className="space-y-1.5">
                  {report.founderStressTest.solid.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#bbb]">
                      <span className="text-green-500 shrink-0">▸</span><span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.founderStressTest.gaps?.length > 0 && (
              <div>
                <p className="text-xs text-amber-500/70 uppercase mb-2">Gaps</p>
                <ul className="space-y-1.5">
                  {report.founderStressTest.gaps.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#bbb]">
                      <span className="text-amber-400 shrink-0">▸</span><span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.founderStressTest.notHonestWith?.length > 0 && (
              <div>
                <p className="text-xs text-red-500/70 uppercase mb-2">Not Honest With Themselves About</p>
                <ul className="space-y-1.5">
                  {report.founderStressTest.notHonestWith.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#bbb]">
                      <span className="text-red-400 shrink-0">▸</span><span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Project Stress Test */}
        {report.projectStressTest && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-5 space-y-4">
            <h3 className="text-xs text-[#555] uppercase tracking-widest">Project Stress Test</h3>
            {report.projectStressTest.coherent?.length > 0 && (
              <div>
                <p className="text-xs text-green-500/70 uppercase mb-2">Coherent</p>
                <ul className="space-y-1.5">
                  {report.projectStressTest.coherent.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#bbb]">
                      <span className="text-green-500 shrink-0">▸</span><span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.projectStressTest.structuralWeaknesses?.length > 0 && (
              <div>
                <p className="text-xs text-amber-500/70 uppercase mb-2">Structural Weaknesses</p>
                <ul className="space-y-1.5">
                  {report.projectStressTest.structuralWeaknesses.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#bbb]">
                      <span className="text-amber-400 shrink-0">▸</span><span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.projectStressTest.unexaminedAssumptions?.length > 0 && (
              <div>
                <p className="text-xs text-red-500/70 uppercase mb-2">Unexamined Assumptions</p>
                <ul className="space-y-1.5">
                  {report.projectStressTest.unexaminedAssumptions.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#bbb]">
                      <span className="text-red-400 shrink-0">▸</span><span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <ListSection title="What You Don't Know Yet" items={report.whatFounderDoesNotKnow} />
        <ListSection title="Most Dangerous Assumptions" items={report.mostDangerousAssumptions} accent="#ef4444" />
        <ListSection title="Must Resolve Before Validation" items={report.mustResolveBeforeValidation} accent="#E8A838" />
        <ListSection title="Kill Signals to Watch" items={report.killSignals} accent="#ef4444" />

        {/* Next Steps */}
        {report.nextSteps?.length > 0 && (
          <div className="bg-[#111] border border-green-900/30 rounded-xl p-5">
            <h3 className="text-xs text-green-500/70 uppercase tracking-widest mb-3">Recommended Next Steps</h3>
            <ol className="space-y-2">
              {report.nextSteps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-[#bbb] leading-relaxed">
                  <span className="text-green-500 font-bold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Final Summary */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-5">
          <h3 className="text-xs text-[#555] uppercase tracking-widest mb-3">Final Assessment</h3>
          <p className="text-[#bbb] text-sm leading-relaxed">{report.finalSummary}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 bg-[#E8A838] text-black font-semibold py-3 rounded-lg text-sm hover:bg-[#d4962e] transition"
          >
            Download PDF
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-3 rounded-lg text-sm border border-[#333] text-[#888] hover:text-white hover:border-[#555] transition"
          >
            {copied ? "Copied ✓" : "Share Link"}
          </button>
        </div>

        {/* AI Disclaimer */}
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-xs text-[#444] leading-relaxed">
            <span className="text-[#555]">AI Disclaimer:</span> This report was generated by an AI model evaluating your written answers. It is not a substitute for domain expertise, professional advice, or real market feedback. Use it as a structured starting point for your own critical thinking, not as a final verdict on your idea's potential.
          </p>
        </div>

        <div className="text-center pt-2">
          <a href="/" className="text-xs text-[#444] hover:text-[#666] transition">
            Start a new session →
          </a>
        </div>
      </div>
    </main>
  );
}
