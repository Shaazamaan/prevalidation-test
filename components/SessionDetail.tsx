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

export default function SessionDetail({ session, report }: Props) {
  const [tab, setTab] = useState<"transcript" | "report" | "json">("transcript");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    await fetch("/api/admin/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: session.id }),
    });
    window.location.href = "/admin/dashboard";
  };

  const tabs = ["transcript", "report", "json"] as const;

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/dashboard" className="text-[#666] hover:text-white text-sm transition">
            ← Dashboard
          </Link>
          <span className="text-[#333]">/</span>
          <span className="text-white text-sm">{session.founderName}</span>
        </div>

        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-crimson text-2xl font-semibold text-white">{session.founderName}</h1>
            <p className="text-[#666] text-sm mt-1 max-w-xl">{session.startupIdea}</p>
            <p className="text-[#444] text-xs mt-1">{new Date(session.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-3">
            <a
              href={`/api/export?sessionId=${session.id}`}
              className="bg-[#E8A838] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d4962e] transition"
            >
              Export PDF
            </a>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-[#1a1a1a] border border-[#333] text-red-400 px-4 py-2 rounded-lg text-sm hover:bg-[#222] transition"
            >
              Delete
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
          <div className="space-y-5">
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
                <div key={p.index} className="bg-[#111] border border-[#222] rounded-xl p-5">
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

        {/* Full Report */}
        {tab === "report" && (
          <div className="space-y-5">
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
                </div>

                {[
                  { title: "Founder — Solid", items: report.founderStressTest.solid },
                  { title: "Founder — Gaps", items: report.founderStressTest.gaps },
                  { title: "Not Honest With Themselves About", items: report.founderStressTest.notHonestWith },
                  { title: "Project — Coherent", items: report.projectStressTest.coherent },
                  { title: "Project — Structural Weaknesses", items: report.projectStressTest.structuralWeaknesses },
                  { title: "Unexamined Assumptions", items: report.projectStressTest.unexaminedAssumptions },
                  { title: "What Founder Does Not Know", items: report.whatFounderDoesNotKnow },
                  { title: "Most Dangerous Assumptions", items: report.mostDangerousAssumptions },
                  { title: "Must Resolve Before Validation", items: report.mustResolveBeforeValidation },
                  { title: "Kill Signals", items: report.killSignals },
                ].map((section) => (
                  <div key={section.title} className="bg-[#111] border border-[#222] rounded-xl p-5">
                    <h3 className="text-xs text-[#555] uppercase mb-3">{section.title}</h3>
                    <ul className="space-y-1.5">
                      {section.items.map((item, i) => (
                        <li key={i} className="text-sm text-[#bbb] flex gap-2">
                          <span className="text-[#E8A838] shrink-0">▸</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="bg-[#111] border border-[#222] rounded-xl p-5">
                  <h3 className="text-xs text-[#555] uppercase mb-3">Final Summary</h3>
                  <p className="text-[#bbb] text-sm leading-relaxed">{report.finalSummary}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Raw JSON */}
        {tab === "json" && (
          <pre className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 text-xs text-[#888] overflow-x-auto">
            {JSON.stringify({ session, report }, null, 2)}
          </pre>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 max-w-sm w-full mx-4">
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
