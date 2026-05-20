"use client";

import { useState } from "react";
import Link from "next/link";
import AdminTable from "@/components/AdminTable";
import type { Session, Report, AdvisorSession, PitchDeckSession } from "@/lib/db";

type EnrichedSession = Session & { report: Report | null };

function exportAdvisorCSV(sessions: AdvisorSession[]) {
  const headers = ["Name", "Email", "Phone", "Country", "Pathway", "Pathway Label", "Overall Score", "Created At"];
  const rows = sessions.map((s) => [
    s.founderName,
    s.email ?? "",
    s.phone ?? "",
    s.country ?? "",
    s.pathway,
    s.pathwayLabel,
    s.overallScore,
    new Date(s.createdAt).toISOString(),
  ]);
  downloadCSV([headers, ...rows], `advisor-sessions-${new Date().toISOString().slice(0, 10)}.csv`);
}

function exportPitchDeckCSV(sessions: PitchDeckSession[]) {
  const headers = ["Name", "Email", "Phone", "Country", "DB Score", "GR Score", "Verdict", "Created At"];
  const rows = sessions.map((s) => [
    s.founderName ?? "",
    s.email ?? "",
    s.phone ?? "",
    s.country ?? "",
    s.dbScore,
    s.grScore,
    s.overallVerdict,
    new Date(s.createdAt).toISOString(),
  ]);
  downloadCSV([headers, ...rows], `pitchdeck-sessions-${new Date().toISOString().slice(0, 10)}.csv`);
}

function downloadCSV(rows: (string | number)[][], filename: string) {
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const PATHWAY_BADGE: Record<string, string> = {
  "PATHWAY 1": "text-green-400 border-green-800 bg-green-900/20",
  "PATHWAY 2": "text-amber-400 border-amber-800 bg-amber-900/20",
  "PATHWAY 3": "text-blue-400 border-blue-800 bg-blue-900/20",
  "PATHWAY 4": "text-purple-400 border-purple-800 bg-purple-900/20",
  "PATHWAY 5": "text-orange-400 border-orange-800 bg-orange-900/20",
  "PATHWAY 6": "text-red-400 border-red-800 bg-red-900/20",
};

const VERDICT_BADGE: Record<string, string> = {
  "FUNDABLE": "text-green-400 border-green-800 bg-green-900/20",
  "CONDITIONALLY FUNDABLE": "text-amber-400 border-amber-800 bg-amber-900/20",
  "NOT FUNDABLE": "text-red-400 border-red-800 bg-red-900/20",
  "GRANT READY": "text-blue-400 border-blue-800 bg-blue-900/20",
  "CONDITIONALLY GRANT READY": "text-purple-400 border-purple-800 bg-purple-900/20",
  "NOT GRANT READY": "text-orange-400 border-orange-800 bg-orange-900/20",
};

function AdvisorSessionsTable({ sessions }: { sessions: AdvisorSession[] }) {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = sessions.filter((s) =>
    s.founderName.toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.country ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch("/api/admin/advisor", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      window.location.reload();
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, country…"
          className="flex-1 bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838]"
        />
        <button
          onClick={() => exportAdvisorCSV(sessions)}
          className="text-xs px-3 py-2 border border-[#333] text-[#666] rounded-lg hover:text-white hover:border-[#555] transition"
        >
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[#444] text-sm text-center py-8">No advisor sessions yet.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="bg-[#111] border border-[#222] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{s.founderName}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {s.email && <p className="text-[#555] text-xs">{s.email}</p>}
                    {s.phone && <p className="text-[#555] text-xs">{s.phone}</p>}
                    {s.country && <p className="text-[#555] text-xs">{s.country}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${PATHWAY_BADGE[s.pathway] ?? "text-[#666] border-[#333]"}`}>
                    {s.pathway}
                  </span>
                  <span className="text-[#E8A838] text-sm font-bold">{s.overallScore}/100</span>
                </div>
              </div>
              <p className="text-[#666] text-xs mt-1">{s.pathwayLabel}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-[#444] text-xs">{new Date(s.createdAt).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <Link
                    href={`/advisor/report/${s.id}`}
                    target="_blank"
                    className="text-xs text-[#E8A838] hover:underline"
                  >
                    View Report ↗
                  </Link>
                  {confirmDelete === s.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        {deleting === s.id ? "Deleting…" : "Confirm"}
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-[#555] hover:text-white">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(s.id)}
                      className="text-xs text-[#444] hover:text-red-400"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PitchDeckSessionsTable({ sessions }: { sessions: PitchDeckSession[] }) {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = sessions.filter((s) =>
    (s.founderName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.country ?? "").toLowerCase().includes(search.toLowerCase()) ||
    s.overallVerdict.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch("/api/admin/pitch-deck", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      window.location.reload();
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, country, verdict…"
          className="flex-1 bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838]"
        />
        <button
          onClick={() => exportPitchDeckCSV(sessions)}
          className="text-xs px-3 py-2 border border-[#333] text-[#666] rounded-lg hover:text-white hover:border-[#555] transition"
        >
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[#444] text-sm text-center py-8">No pitch deck sessions yet.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="bg-[#111] border border-[#222] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{s.founderName ?? "—"}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {s.email && <p className="text-[#555] text-xs">{s.email}</p>}
                    {s.phone && <p className="text-[#555] text-xs">{s.phone}</p>}
                    {s.country && <p className="text-[#555] text-xs">{s.country}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-[#E8A838] text-sm font-bold">DB {s.dbScore} / GR {s.grScore}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${VERDICT_BADGE[s.overallVerdict] ?? "text-[#666] border-[#333]"}`}>
                      {s.overallVerdict}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-[#444] text-xs">{new Date(s.createdAt).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <Link
                    href={`/pitch-deck/report/${s.id}`}
                    target="_blank"
                    className="text-xs text-[#E8A838] hover:underline"
                  >
                    View Report ↗
                  </Link>
                  {confirmDelete === s.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        {deleting === s.id ? "Deleting…" : "Confirm"}
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-[#555] hover:text-white">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(s.id)}
                      className="text-xs text-[#444] hover:text-red-400"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TABS = ["Readiness Check", "Advisor", "Pitch Deck"] as const;
type Tab = typeof TABS[number];

export default function AdminDashboardClient({
  readinessSessions,
  advisorSessions,
  pitchDeckSessions,
}: {
  readinessSessions: EnrichedSession[];
  advisorSessions: AdvisorSession[];
  pitchDeckSessions: PitchDeckSession[];
}) {
  const [tab, setTab] = useState<Tab>("Readiness Check");

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#1a1a1a]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t
                ? "border-[#E8A838] text-[#E8A838]"
                : "border-transparent text-[#555] hover:text-white"
            }`}
          >
            {t}
            <span className="ml-1.5 text-xs opacity-60">
              {t === "Readiness Check" ? readinessSessions.length
                : t === "Advisor" ? advisorSessions.length
                : pitchDeckSessions.length}
            </span>
          </button>
        ))}
      </div>

      {tab === "Readiness Check" && <AdminTable sessions={readinessSessions} />}
      {tab === "Advisor" && <AdvisorSessionsTable sessions={advisorSessions} />}
      {tab === "Pitch Deck" && <PitchDeckSessionsTable sessions={pitchDeckSessions} />}
    </div>
  );
}
