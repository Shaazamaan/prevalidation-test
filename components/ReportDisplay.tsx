"use client";

import { useState, useEffect, useRef } from "react";
import type { Report } from "@/lib/db";
import NPSSurvey from "@/components/NPSSurvey";
import ShareButtons from "@/components/ShareButtons";

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
  userEmail?: string;
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

function scorePercentile(score: number): number {
  if (score >= 80) return 90;
  if (score >= 70) return 75;
  if (score >= 60) return 58;
  if (score >= 50) return 44;
  if (score >= 40) return 30;
  return 15;
}

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

function ScoreExplainer({ phaseScores }: { phaseScores: Report["phaseScores"] }) {
  const [open, setOpen] = useState(false);
  if (!phaseScores?.length) return null;

  const PHASE_CONTEXT: Record<number, string> = {
    1: "Evaluates how deep your understanding of the problem is and whether real people feel it acutely.",
    2: "Measures how clearly differentiated and defensible your solution is in the market.",
    3: "Checks whether a large enough market exists and whether you can realistically capture part of it.",
    4: "Assesses your go-to-market clarity — how you'll acquire the first 100 customers.",
    5: "Reviews the team's ability to execute: relevant skills, commitment, and gap awareness.",
    6: "Gauges how grounded your traction claims are and whether momentum is real.",
    7: "Evaluates your financial understanding — pricing, unit economics, and runway thinking.",
    8: "Checks your awareness of competitive threats and how you'll maintain an edge.",
    9: "Reviews whether you understand the regulatory and operational constraints ahead.",
    10: "Overall founder-market fit: are you the right person to solve this problem?",
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="text-xs text-[#555] uppercase tracking-widest">What each phase score means</span>
        <span className="text-[#444] text-xs">{open ? "▲ Hide" : "▼ Show"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#1a1a1a]">
          {phaseScores.map((ps) => (
            <div key={ps.phase}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#888] text-xs"><span className="text-[#555]">{ps.phase}.</span> {ps.title}</span>
                <span className={`text-xs font-bold ${ps.score >= 7 ? "text-green-400" : ps.score >= 5 ? "text-amber-400" : "text-red-400"}`}>{ps.score}/10</span>
              </div>
              <p className="text-[#555] text-xs leading-relaxed mb-1">{PHASE_CONTEXT[ps.phase] ?? ""}</p>
              {ps.note && <p className="text-[#888] text-xs leading-relaxed">{ps.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InvestorObjections({ report }: { report: Props["report"] }) {
  const [open, setOpen] = useState(false);

  const objections: string[] = [];

  if (report.mostDangerousAssumptions?.length) {
    objections.push(`"Have you validated that ${report.mostDangerousAssumptions[0].toLowerCase().replace(/\.$/, "")}?"`);
  }
  if (report.killSignals?.length) {
    objections.push(`"How do you plan to avoid the situation where ${report.killSignals[0].toLowerCase().replace(/\.$/, "")}?"`);
  }
  if (report.founderStressTest?.gaps?.length) {
    objections.push(`"Your gap in ${report.founderStressTest.gaps[0].toLowerCase().replace(/\.$/, "")} — how will you address that?"`);
  }
  if (report.projectStressTest?.structuralWeaknesses?.length) {
    objections.push(`"You mentioned ${report.projectStressTest.structuralWeaknesses[0].toLowerCase().replace(/\.$/, "")} — walk me through how that's not a dealbreaker."`);
  }
  if (report.projectStressTest?.unexaminedAssumptions?.length) {
    objections.push(`"You're assuming ${report.projectStressTest.unexaminedAssumptions[0].toLowerCase().replace(/\.$/, "")} — what happens if that's wrong?"`);
  }
  if (report.mustResolveBeforeValidation?.length) {
    objections.push(`"Before we go further — have you resolved the issue of ${report.mustResolveBeforeValidation[0].toLowerCase().replace(/\.$/, "")}?"`);
  }
  if (report.whatFounderDoesNotKnow?.length) {
    objections.push(`"You said you're uncertain about ${report.whatFounderDoesNotKnow[0].toLowerCase().replace(/\.$/, "")} — that's a core assumption. Why invest now?"`);
  }

  const defaults = [
    `"What's your moat? Why can't a well-funded competitor do this in 6 months?"`,
    `"Why now? What changed in the market that makes this the right time?"`,
    `"What does your ideal customer look like, and have you spoken with 20 of them?"`,
    `"Walk me through how you'll spend the first ₹50 lakhs — month by month."`,
    `"If your biggest assumption turns out to be wrong, what's plan B?"`,
  ];

  while (objections.length < 5) {
    const d = defaults[objections.length];
    if (d && !objections.includes(d)) objections.push(d);
    else break;
  }

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="text-xs text-[#555] uppercase tracking-widest">Likely investor objections</span>
        <span className="text-[#444] text-xs">{open ? "▲ Hide" : "▼ Show"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-[#1a1a1a]">
          <p className="text-[#444] text-xs mt-4 mb-3">Based on your report, expect these questions in investor meetings:</p>
          <div className="space-y-3">
            {objections.slice(0, 7).map((obj, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-[#E8A838] text-xs font-bold shrink-0 mt-0.5">Q{i + 1}</span>
                <p className="text-[#bbb] text-sm italic leading-relaxed">{obj}</p>
              </div>
            ))}
          </div>
          <p className="text-[#333] text-xs mt-4">Prepare concise, evidence-backed answers to each. Practice them out loud.</p>
        </div>
      )}
    </div>
  );
}

function ScoreImprovementBanner({ currentScore, sessionId, userEmail }: { currentScore: number; sessionId: string; userEmail?: string }) {
  const [improvement, setImprovement] = useState<number | null>(null);

  useEffect(() => {
    if (!userEmail) return;
    fetch("/api/score-history")
      .then((r) => r.json())
      .then((d: { history?: { score: number; sessionId: string; recordedAt: number }[] }) => {
        if (!d.history || d.history.length < 2) return;
        // Find second most recent entry that is NOT the current session
        const others = d.history.filter((e) => e.sessionId !== sessionId);
        if (!others.length) return;
        const prev = others[0]; // history is newest-first after the filter
        const delta = currentScore - prev.score;
        if (delta > 0) setImprovement(delta);
      })
      .catch(() => {});
  }, [userEmail, sessionId, currentScore]);

  if (!improvement) return null;

  return (
    <div className="bg-green-900/15 border border-green-800/40 rounded-xl p-4 flex items-center gap-3">
      <span className="text-2xl shrink-0">📈</span>
      <div>
        <p className="text-green-400 text-sm font-semibold">Score improved by +{improvement} points</p>
        <p className="text-[#555] text-xs mt-0.5">Keep addressing the gaps — founders who iterate consistently score higher with each pass.</p>
      </div>
    </div>
  );
}

function ShareToFeed({ score, verdict, userEmail }: { score: number; verdict: string; userEmail?: string }) {
  const [posted, setPosted] = useState(false);
  const [posting, setPosting] = useState(false);

  if (!userEmail) return null;
  if (posted) return <p className="text-green-400 text-xs text-center">Posted to community feed ✓</p>;

  const verdictShort = verdict === "READY" ? "passed" : verdict === "CONDITIONALLY READY" ? "conditionally passed" : "got flagged";

  const handlePost = async () => {
    setPosting(true);
    const content = `Just got my startup reality check on Devbridge. Scored ${score}/100 — ${verdictShort}. Running AI evaluations beats guessing. 🚀`;
    try {
      await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setPosted(true);
    } catch {
      // silently ignore
    }
    setPosting(false);
  };

  return (
    <button
      onClick={handlePost}
      disabled={posting}
      className="w-full text-xs py-2 border border-[#222] text-[#555] hover:text-[#E8A838] hover:border-[#E8A838]/30 rounded-lg transition disabled:opacity-50"
    >
      {posting ? "Posting…" : "Share your score to the Devbridge community feed →"}
    </button>
  );
}

export default function ReportDisplay({ report, founderName, sessionId, userEmail }: Props) {
  const [showNPS, setShowNPS] = useState(false);
  const [guestBarVisible, setGuestBarVisible] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const style = VERDICT_STYLES[report.verdict] ?? VERDICT_STYLES["NOT READY"];
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/report/${sessionId}` : `/report/${sessionId}`;
  const percentile = scorePercentile(report.realityScore ?? 0);

  useEffect(() => {
    const timer = setTimeout(() => setShowNPS(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (userEmail) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setGuestBarVisible(true); },
      { threshold: 0.3 }
    );
    if (shareRef.current) observer.observe(shareRef.current);
    return () => observer.disconnect();
  }, [userEmail]);

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

        {/* Score improvement celebration */}
        <ScoreImprovementBanner
          currentScore={report.realityScore ?? 0}
          sessionId={sessionId}
          userEmail={userEmail}
        />

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
            <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex items-center gap-2">
              <div className="flex-1 bg-[#1a1a1a] rounded-full h-1">
                <div className="bg-[#E8A838] h-1 rounded-full" style={{ width: `${percentile}%` }} />
              </div>
              <span className="text-[10px] text-[#E8A838] shrink-0 font-medium">
                Top {100 - percentile}% of founders evaluated
              </span>
            </div>
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

        {/* Score Explainer */}
        <ScoreExplainer phaseScores={report.phaseScores} />

        {/* Investor Objections */}
        <InvestorObjections report={report} />

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
        </div>

        {/* Share */}
        <div ref={shareRef} className="space-y-3">
          <p className="text-[#444] text-xs text-center mb-3">Share your results</p>
          <ShareButtons score={report.realityScore ?? 0} url={shareUrl} verdict={report.verdict} />
          <ShareToFeed score={report.realityScore ?? 0} verdict={report.verdict} userEmail={userEmail} />
        </div>

        {/* Re-evaluate reminder */}
        <div className="bg-[#0d0d0d] border border-[#E8A838]/10 rounded-xl p-5">
          <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-1">Come Back in 30 Days</p>
          <p className="text-[#bbb] text-sm leading-relaxed">
            Founders who re-evaluate after addressing feedback consistently score higher. Book a reminder to track your progress.
          </p>
          <a href="/" className="text-xs text-[#E8A838] hover:underline mt-2 inline-block">Run a new evaluation →</a>
        </div>

        {/* AI Tools Promo */}
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
          <p className="text-[#E8A838] text-xs uppercase tracking-wider mb-2">What&apos;s next?</p>
          <h3 className="text-white text-sm font-medium mb-3">Use AI tools built for your stage</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/tools/pivot-advisor", label: "Pivot Advisor" },
              { href: "/tools/gtm-strategy", label: "GTM Strategy" },
              { href: "/tools/one-pager", label: "Investor One-Pager" },
              { href: "/tools/interview-script", label: "Customer Interview" },
            ].map((t) => (
              <a key={t.href} href={t.href} className="text-xs px-3 py-2 bg-[#111] border border-[#222] rounded-lg text-[#888] hover:text-white hover:border-[#E8A838]/30 transition text-center">
                {t.label}
              </a>
            ))}
          </div>
        </div>

        {/* AI Disclaimer */}
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-xs text-[#444] leading-relaxed">
            <span className="text-[#555]">AI Disclaimer:</span> This report was generated by an AI model evaluating your written answers. It is not a substitute for domain expertise, professional advice, or real market feedback. Use it as a structured starting point for your own critical thinking, not as a final verdict on your idea&apos;s potential.
          </p>
        </div>

        <div className="text-center pt-2">
          <a href="/" className="text-xs text-[#444] hover:text-[#666] transition">
            Start a new session →
          </a>
        </div>
      </div>

      {/* NPS Survey - shown after 8 seconds */}
      {showNPS && userEmail && (
        <NPSSurvey
          email={userEmail}
          tool="readiness"
          onDismiss={() => setShowNPS(false)}
        />
      )}

      {/* Guest acquisition sticky bar */}
      {!userEmail && guestBarVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d0d]/95 backdrop-blur border-t border-[#E8A838]/20 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-white text-sm font-semibold">Want this for YOUR startup?</p>
              <p className="text-[#555] text-xs">Full AI readiness report in 10 minutes. Free to start.</p>
            </div>
            <a
              href="/login"
              className="shrink-0 px-4 py-2 bg-[#E8A838] text-black text-sm font-semibold rounded-lg hover:bg-[#f0b84a] transition"
            >
              Try it free →
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
