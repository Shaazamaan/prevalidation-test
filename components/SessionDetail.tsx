"use client";

import { useState } from "react";
import Link from "next/link";
import type { Session, Report } from "@/lib/db";

type Props = {
  session: Session;
  report: Report | null;
};

const VERDICT_STYLES: Record<string, string> = {
  READY: "text-green-400",
  "CONDITIONALLY READY": "text-amber-400",
  "NOT READY": "text-red-400",
};

function phaseScoreColor(score: number): string {
  if (score >= 7) return "bg-green-500";
  if (score >= 5) return "bg-amber-500";
  return "bg-red-500";
}

export default function SessionDetail({ session, report }: Props) {
  const [tab, setTab] = useState<"transcript" | "report" | "json">("transcript");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notes, setNotes] = useState(session.adminNotes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [reEvaluating, setReEvaluating] = useState(false);
  const [reEvalError, setReEvalError] = useState("");

  const tabs = ["transcript", "report", "json"] as const;

  const handleDelete = async () => {
    await fetch("/api/admin/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: session.id }),
    });
    window.location.href = "/admin/dashboard";
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await fetch("/api/admin/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, notes }),
    });
    setSavingNotes(false);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleReEvaluate = async () => {
    if (!confirm("Re-evaluate this session? This will regenerate the report using the existing answers.")) return;
    setReEvaluating(true);
    setReEvalError("");
    const res = await fetch("/api/admin/re-evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json();
      setReEvalError(data.error ?? "Re-evaluation failed.");
      setReEvaluating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/dashboard" className="text-[#666] hover:text-white text-sm transition">
            ← Dashboard
          </Link>
          <span className="text-[#333]">/</span>
          <span className="text-white text-sm truncate max-w-xs">{session.founderName}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-crimson text-2xl font-semibold text-white">{session.founderName}</h1>
            <p className="text-[#666] text-sm mt-1 max-w-xl leading-relaxed">{session.startupIdea}</p>
            <div className="flex flex-wrap gap-3 mt-2">
              <p className="text-[#444] text-xs">{new Date(session.createdAt).toLocaleString()}</p>
              {session.email && (
                <a href={`mailto:${session.email}`} className="text-xs text-[#555] hover:text-[#E8A838] transition">{session.email}</a>
              )}
              {session.phone && (
                <span className="text-xs text-[#555]">{session.phone}</span>
              )}
              {session.country && (
                <span className="text-xs text-[#555] border border-[#222] px-2 py-0.5 rounded">{session.country}</span>
              )}
              {session.startupType && (
                <span className="text-xs text-[#555] border border-[#222] px-2 py-0.5 rounded">{session.startupType}</span>
              )}
              {session.payment && !session.payment.isAdmin && (
                <span className={`text-xs px-2 py-0.5 rounded border ${
                  session.payment.isFree
                    ? "border-green-800/40 text-green-400 bg-green-900/10"
                    : "border-[#E8A838]/40 text-[#E8A838] bg-[#E8A838]/5"
                }`}>
                  {session.payment.isFree
                    ? `FREE · ${session.payment.coupon ?? ""}`
                    : `₹${(session.payment.amount / 100).toLocaleString("en-IN")} · ${session.payment.mode?.toUpperCase()}`}
                </span>
              )}
              {session.payment?.orderId && session.payment.orderId !== "ADMIN" && (
                <span className="text-[10px] text-[#444] font-mono border border-[#1a1a1a] px-1.5 py-0.5 rounded">
                  {session.payment.orderId}
                </span>
              )}
              {report && (
                <span className={`text-xs font-semibold ${VERDICT_STYLES[report.verdict] ?? "text-white"}`}>
                  {report.verdict}
                </span>
              )}
              {typeof report?.realityScore === "number" && (
                <span className="text-xs text-[#555]">Reality: {report.realityScore}/100</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a
              href={`/api/export?sessionId=${session.id}`}
              className="bg-[#E8A838] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d4962e] transition"
            >
              Export PDF
            </a>
            <button
              onClick={handleReEvaluate}
              disabled={reEvaluating}
              className="bg-[#1a1a1a] border border-[#333] text-[#888] px-4 py-2 rounded-lg text-sm hover:bg-[#222] hover:text-white transition disabled:opacity-50"
            >
              {reEvaluating ? "Re-evaluating…" : "Re-evaluate"}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-[#1a1a1a] border border-[#333] text-red-400 px-4 py-2 rounded-lg text-sm hover:bg-[#222] transition"
            >
              Delete
            </button>
          </div>
        </div>

        {reEvalError && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 mb-4">
            <p className="text-red-400 text-sm">{reEvalError}</p>
          </div>
        )}

        {/* Admin Notes */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-4 mb-6">
          <p className="text-xs text-[#555] uppercase mb-2">Admin Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Internal notes about this session…"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] resize-none transition"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="text-xs px-3 py-1.5 bg-[#1a1a1a] border border-[#333] text-[#888] hover:text-white rounded-lg transition disabled:opacity-50"
            >
              {savingNotes ? "Saving…" : notesSaved ? "Saved ✓" : "Save Notes"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1a1a1a] mb-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm capitalize transition ${
                tab === t
                  ? "text-[#E8A838] border-b-2 border-[#E8A838]"
                  : "text-[#555] hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Transcript */}
        {tab === "transcript" && (
          <div className="space-y-4">
            {session.messages.length === 0 && (
              <p className="text-[#555] text-sm">No answers recorded yet.</p>
            )}
            {(() => {
              const pairs: { question: string; answer: string; index: number }[] = [];
              for (let i = 0; i < session.messages.length - 1; i += 2) {
                const q = session.messages[i];
                const a = session.messages[i + 1];
                if (q?.role === "assistant" && a?.role === "user") {
                  pairs.push({ question: q.content, answer: a.content, index: i / 2 });
                }
              }
              return pairs.map((p) => (
                <div key={p.index} className="bg-[#111] border border-[#222] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[#E8A838] uppercase mb-2">
                    {p.question.startsWith("Q") ? p.question.split(":")[0] : `Q${p.index + 1}`}
                  </p>
                  <p className="text-[#aaa] text-sm mb-3 leading-relaxed">
                    {p.question.includes(":") ? p.question.slice(p.question.indexOf(":") + 1).trim() : p.question}
                  </p>
                  <div className="border-t border-[#1a1a1a] pt-3">
                    <p className="text-xs text-[#555] uppercase mb-1">Answer</p>
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{p.answer}</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* Report */}
        {tab === "report" && (
          <div className="space-y-4">
            {!report ? (
              <p className="text-[#555] text-sm">Report not yet generated.</p>
            ) : (
              <>
                <div className="bg-[#111] border border-[#222] rounded-xl p-5">
                  <h3 className="text-xs text-[#555] uppercase mb-1">Verdict</h3>
                  <p className={`text-lg font-bold ${VERDICT_STYLES[report.verdict] ?? "text-white"}`}>
                    {report.verdict}
                  </p>
                  <p className="text-[#bbb] text-sm mt-2">{report.verdictExplanation}</p>
                  {typeof report.realityScore === "number" && (
                    <p className="text-[#666] text-xs mt-2">Reality Score: {report.realityScore}/100</p>
                  )}
                </div>

                {/* Phase Scores */}
                {report.phaseScores?.length > 0 && (
                  <div className="bg-[#111] border border-[#222] rounded-xl p-5">
                    <h3 className="text-xs text-[#555] uppercase mb-4">Phase Scores</h3>
                    <div className="space-y-2">
                      {report.phaseScores.map((ps) => (
                        <div key={ps.phase} className="flex items-center gap-3">
                          <span className="text-xs text-[#555] w-4 shrink-0">{ps.phase}</span>
                          <div className="flex-1 bg-[#1a1a1a] rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${phaseScoreColor(ps.score)}`}
                              style={{ width: `${(ps.score / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-white w-8 shrink-0 text-right">{ps.score}/10</span>
                          <span className="text-xs text-[#555] max-w-xs truncate hidden sm:block">{ps.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {[
                  { title: "Contradictions", items: report.contradictions },
                  { title: "Founder — Solid", items: report.founderStressTest?.solid },
                  { title: "Founder — Gaps", items: report.founderStressTest?.gaps },
                  { title: "Not Honest With Themselves About", items: report.founderStressTest?.notHonestWith },
                  { title: "Project — Coherent", items: report.projectStressTest?.coherent },
                  { title: "Project — Structural Weaknesses", items: report.projectStressTest?.structuralWeaknesses },
                  { title: "Unexamined Assumptions", items: report.projectStressTest?.unexaminedAssumptions },
                  { title: "What Founder Does Not Know", items: report.whatFounderDoesNotKnow },
                  { title: "Most Dangerous Assumptions", items: report.mostDangerousAssumptions },
                  { title: "Must Resolve Before Validation", items: report.mustResolveBeforeValidation },
                  { title: "Next Steps", items: report.nextSteps },
                  { title: "Kill Signals", items: report.killSignals },
                ].filter((s) => (s.items?.length ?? 0) > 0).map((section) => (
                  <div key={section.title} className="bg-[#111] border border-[#222] rounded-xl p-4">
                    <h3 className="text-xs text-[#555] uppercase mb-3">{section.title}</h3>
                    <ul className="space-y-1.5">
                      {section.items!.map((item, i) => (
                        <li key={i} className="text-sm text-[#bbb] flex gap-2">
                          <span className="text-[#E8A838] shrink-0">▸</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                  <h3 className="text-xs text-[#555] uppercase mb-3">Final Summary</h3>
                  <p className="text-[#bbb] text-sm leading-relaxed">{report.finalSummary}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* JSON */}
        {tab === "json" && (
          <pre className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 text-xs text-[#888] overflow-x-auto">
            {JSON.stringify({ session, report }, null, 2)}
          </pre>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-crimson text-lg text-white mb-2">Delete Session?</h3>
            <p className="text-[#888] text-sm mb-5">All data for this session will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-[#222] text-white py-2 rounded-lg text-sm hover:bg-[#333] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
