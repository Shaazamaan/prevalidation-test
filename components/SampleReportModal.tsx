"use client";

import { useState } from "react";

const SAMPLE = {
  verdict: "CONDITIONALLY READY" as const,
  verdictExplanation:
    "Alex has a genuine problem insight and a specific customer in mind, but the financial model is built on assumptions that have not been tested. The path from beta to revenue has a gap that must be closed before validation spending is justified.",
  realityScore: 61,
  phaseScores: [
    { phase: 1, title: "The Problem", score: 8, note: "Specific, witnessed firsthand, with a clear recurring cost." },
    { phase: 2, title: "The Solution Logic", score: 6, note: "Logical but relies on an untested assumption about switching behaviour." },
    { phase: 3, title: "The Customer", score: 7, note: "Narrow segment identified; purchase authority not fully confirmed." },
    { phase: 4, title: "Market Reality", score: 5, note: "Market size estimated with no primary research — numbers borrowed from broad reports." },
    { phase: 5, title: "Competition", score: 6, note: "Main competitors named but differentiation is feature-level, not structural." },
    { phase: 6, title: "Business Model", score: 4, note: "Pricing is a guess. No comparable pricing benchmarks cited." },
    { phase: 7, title: "Traction", score: 3, note: "No conversations with potential customers yet. Zero evidence of demand." },
    { phase: 8, title: "Founder-Market Fit", score: 7, note: "Relevant background; has experienced the problem personally." },
    { phase: 9, title: "Execution Plan", score: 5, note: "Timeline is optimistic. No technical co-founder identified." },
    { phase: 10, title: "Risk Awareness", score: 4, note: "Risks listed are generic. No mitigation plans." },
    { phase: 11, title: "Launch Reality", score: 5, note: "Launch plan exists but depends on channels not yet tested." },
    { phase: 12, title: "Financial Reality", score: 3, note: "No unit economics calculated. Break-even is a rough guess." },
    { phase: 13, title: "Industry Risk", score: 6, note: "SaaS-specific risks acknowledged but churn not addressed." },
    { phase: 14, title: "Team & Legal", score: 5, note: "Solo founder with no technical help identified yet." },
  ],
  contradictions: [
    "In Phase 3 the founder claims the target customer is independent freelancers, but in Phase 4 cites enterprise market size data. These segments have entirely different acquisition costs and willingness to pay.",
    "Phase 2 describes a simple tool taking weeks to build, but Phase 9 projects a 9-month timeline to launch. The complexity implied by the timeline contradicts the simplicity claimed for the product.",
  ],
  founderStressTest: {
    solid: [
      "Has personally experienced the problem and can describe it with specific financial impact.",
      "Understands the customer's workflow well enough to identify the exact friction point.",
      "Clear on what the MVP would look like — not over-building.",
    ],
    gaps: [
      "Has not spoken to a single potential customer yet. All assumptions are untested.",
      "Cannot explain how they will acquire the first 10 customers with specifics.",
      "No financial model — cannot state what the business needs to break even.",
    ],
    notHonestWith: [
      "The assumption that freelancers will pay a subscription for a tool they currently do for free with spreadsheets.",
      "The belief that building the product is the hard part — distribution is the actual bottleneck.",
    ],
  },
  mustResolveBeforeValidation: [
    "Have 10 conversations with target customers before writing a single line of code. Validate that they experience the problem as described AND that they would pay for a solution.",
    "Calculate a basic unit economics model: target price × conversion rate − CAC. If the numbers don't work at a realistic scale, the business model needs rethinking.",
    "Identify how the first 100 customers will be reached, and test at least one channel with a no-code landing page before building.",
  ],
  killSignals: [
    "If 8 out of 10 customer conversations reveal they already have an acceptable workaround and feel no urgency to change.",
    "If the willingness-to-pay number revealed in conversations is less than 40% of the price needed for the business to be viable.",
  ],
  nextSteps: [
    "Book 10 customer discovery calls this week. Do not pitch — only ask about their current process and the last time the problem cost them time or money.",
    "Build a one-page landing page describing the product and add a waitlist. Run £50 of targeted ads and measure click-through and sign-up rates.",
    "Write out your unit economics: minimum viable price × realistic conversion rate. Stress test whether the business can reach profitability in under 18 months.",
  ],
  finalSummary:
    "Alex has the makings of a real business — a specific problem, a plausible solution, and relevant domain experience. But the entire foundation rests on assumptions that have not touched a single real customer. The reality score of 61 reflects a founder who is thinking carefully but operating entirely in hypothesis mode. The financial model does not exist in any meaningful form. Before spending another week building, Alex needs 10 customer conversations and a unit economics calculation. If those conversations validate the problem and willingness to pay, this idea has a clear path forward. If they don't, it's better to discover that now for free than after months of building.",
};

function phaseColor(score: number) {
  if (score >= 7) return "bg-green-500";
  if (score >= 5) return "bg-amber-500";
  return "bg-red-500";
}

function realityColor(score: number) {
  if (score >= 70) return "text-green-400";
  if (score >= 45) return "text-amber-400";
  return "text-red-400";
}

export default function SampleReportModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[#555] hover:text-[#E8A838] transition underline underline-offset-2"
      >
        See what a report looks like →
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-[#0d0d0d] border border-[#222] rounded-2xl w-full max-w-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
              <div>
                <p className="text-xs text-[#555] uppercase tracking-widest mb-0.5">Sample Report</p>
                <h2 className="font-crimson text-lg text-white font-semibold">Alex — Freelancer Scheduling Tool</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[#555] hover:text-white text-xl leading-none transition"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Verdict */}
              <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl p-4 text-center">
                <div className="text-amber-400 text-xl font-bold mb-1">{SAMPLE.verdict}</div>
                <p className="text-[#bbb] text-sm leading-relaxed">{SAMPLE.verdictExplanation}</p>
              </div>

              {/* Reality Score */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#555] uppercase tracking-widest">Reality Score</span>
                  <span className={`text-2xl font-bold ${realityColor(SAMPLE.realityScore)}`}>
                    {SAMPLE.realityScore}<span className="text-sm text-[#555]">/100</span>
                  </span>
                </div>
                <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                  <div className="h-2 rounded-full bg-amber-500" style={{ width: `${SAMPLE.realityScore}%` }} />
                </div>
                <p className="text-[#555] text-xs mt-2">Measures how grounded your answers are in facts vs. assumptions.</p>
              </div>

              {/* Phase Scores */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                <p className="text-xs text-[#555] uppercase tracking-widest mb-3">Phase Scores</p>
                <div className="space-y-2">
                  {SAMPLE.phaseScores.map((ps) => (
                    <div key={ps.phase}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-[#555] w-4 shrink-0">{ps.phase}</span>
                        <div className="flex-1 bg-[#1a1a1a] rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${phaseColor(ps.score)}`} style={{ width: `${(ps.score / 10) * 100}%` }} />
                        </div>
                        <span className="text-xs text-white w-8 text-right shrink-0">{ps.score}/10</span>
                        <span className="text-xs text-[#555] hidden sm:block w-40 truncate">{ps.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contradictions */}
              <div className="bg-[#111] border border-red-900/30 rounded-xl p-4">
                <p className="text-xs text-red-500/70 uppercase tracking-widest mb-3">Contradictions Detected</p>
                <ul className="space-y-2">
                  {SAMPLE.contradictions.map((c, i) => (
                    <li key={i} className="flex gap-2 text-xs text-[#bbb] leading-relaxed">
                      <span className="text-red-400 shrink-0">⚠</span><span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Must Resolve */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                <p className="text-xs text-[#555] uppercase tracking-widest mb-3">Must Resolve Before Validation</p>
                <ul className="space-y-2">
                  {SAMPLE.mustResolveBeforeValidation.map((item, i) => (
                    <li key={i} className="flex gap-2 text-xs text-[#bbb] leading-relaxed">
                      <span className="text-[#E8A838] shrink-0">▸</span><span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Final Summary */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                <p className="text-xs text-[#555] uppercase tracking-widest mb-2">Final Assessment</p>
                <p className="text-[#bbb] text-sm leading-relaxed">{SAMPLE.finalSummary}</p>
              </div>

              {/* CTA */}
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 text-center">
                <p className="text-[#555] text-xs mb-3">This is a sample. Your report will be based on your actual answers.</p>
                <a
                  href="/"
                  onClick={() => setOpen(false)}
                  className="inline-block bg-[#E8A838] text-black font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#d4962e] transition"
                >
                  Start your own interrogation →
                </a>
              </div>

              <p className="text-center text-xs text-[#333]">
                AI-generated — use as a thinking tool, not a final verdict.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
