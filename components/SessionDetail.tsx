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
          <div className="space-y-4">
            {session.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-[#141414] border border-[#2a2a2a] text-[#e0e0e0]"
                      : "bg-[#1a1200] border border-[#3a2800] text-[#f5d9a0]"
                  }`}
                >
                  <p className="text-xs text-[#555] mb-1 uppercase">{msg.role}</p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs text-[#444] mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {session.messages.length === 0 && (
              <p className="text-[#555] text-sm">No messages yet.</p>
            )}
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
