"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminTable from "@/components/AdminTable";
import type { Session, Report, AdvisorSession, PitchDeckSession } from "@/lib/db";

function InlineNotes({ id, endpoint, initial }: { id: string; endpoint: string; initial?: string }) {
  const [notes, setNotes] = useState(initial ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminNotes: notes }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={`text-xs mt-2 ${notes ? "text-[#888]" : "text-[#444] hover:text-[#666]"} transition text-left w-full`}
      >
        {notes ? `📝 ${notes}` : saved ? "✓ Saved" : "+ Add note"}
      </button>
    );
  }

  return (
    <div className="mt-2 flex gap-2 items-start">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Admin notes…"
        className="flex-1 text-xs bg-[#0d0d0d] border border-[#333] rounded-lg px-2 py-1.5 text-[#888] placeholder-[#444] focus:outline-none focus:border-[#E8A838] resize-none"
        autoFocus
      />
      <div className="flex flex-col gap-1">
        <button onClick={save} disabled={saving} className="text-xs px-2 py-1 bg-[#E8A838] text-black rounded font-medium disabled:opacity-50">
          {saving ? "…" : "Save"}
        </button>
        <button onClick={() => setEditing(false)} className="text-xs px-2 py-1 text-[#444] hover:text-white">
          Cancel
        </button>
      </div>
    </div>
  );
}

type EnrichedSession = Session & { report: Report | null };

function exportAdvisorCSV(sessions: AdvisorSession[]) {
  const headers = ["Name", "Email", "Phone", "Country", "Pathway", "Pathway Label", "Overall Score", "Created At", "Admin Notes"];
  const rows = sessions.map((s) => [
    s.founderName,
    s.email ?? "",
    s.phone ?? "",
    s.country ?? "",
    s.pathway,
    s.pathwayLabel,
    s.overallScore,
    new Date(s.createdAt).toISOString(),
    s.adminNotes ?? "",
  ]);
  downloadCSV([headers, ...rows], `advisor-sessions-${new Date().toISOString().slice(0, 10)}.csv`);
}

function exportPitchDeckCSV(sessions: PitchDeckSession[]) {
  const headers = ["Name", "Email", "Phone", "Country", "DB Score", "GR Score", "Verdict", "Created At", "Admin Notes"];
  const rows = sessions.map((s) => [
    s.founderName ?? "",
    s.email ?? "",
    s.phone ?? "",
    s.country ?? "",
    s.dbScore,
    s.grScore,
    s.overallVerdict,
    new Date(s.createdAt).toISOString(),
    s.adminNotes ?? "",
  ]);
  downloadCSV([headers, ...rows], `pitchdeck-sessions-${new Date().toISOString().slice(0, 10)}.csv`);
}

function sanitizeCSVCell(v: string | number): string {
  const s = String(v);
  // Prevent formula injection: prefix dangerous-start chars with a tab
  const safe = /^[=+\-@\t\r]/.test(s) ? `\t${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadCSV(rows: (string | number)[][], filename: string) {
  const csv = rows.map((r) => r.map(sanitizeCSVCell).join(",")).join("\n");
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

function RevenueChart({ days, dayCounts }: { days: string[]; dayCounts: number[] }) {
  const max = Math.max(...dayCounts, 1);
  const allZero = dayCounts.every((c) => c === 0);

  if (allZero) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-xl p-4 mb-6">
        <p className="text-xs text-[#555] uppercase mb-3">Last 7 Days</p>
        <p className="text-[#444] text-sm text-center py-4">No sessions yet this week</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-4 mb-6">
      <p className="text-xs text-[#555] uppercase mb-4">Last 7 Days</p>
      <div className="flex items-end gap-2 h-24">
        {dayCounts.map((count, i) => {
          const heightPct = Math.max((count / max) * 100, count > 0 ? 8 : 4);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {count > 0 && (
                <span className="text-[10px] text-[#888]">{count}</span>
              )}
              <div
                className="w-full rounded-t"
                style={{
                  height: `${heightPct}%`,
                  background: count > 0 ? "#E8A838" : "#222",
                  minHeight: 4,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-1">
        {days.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-[#444] truncate">{d}</div>
        ))}
      </div>
    </div>
  );
}

function AdvisorSessionsTable({ sessions }: { sessions: AdvisorSession[] }) {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [reEvaluating, setReEvaluating] = useState<string | null>(null);
  const [reEvalResult, setReEvalResult] = useState<Record<string, string>>({});

  const filtered = sessions.filter((s) =>
    s.founderName.toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.country ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setDeleteError("");
    try {
      const res = await fetch("/api/admin/advisor", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      window.location.reload();
    } catch {
      setDeleteError("Failed to delete. Please try again.");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const handleReEvaluate = async (s: AdvisorSession) => {
    setReEvaluating(s.id);
    try {
      const res = await fetch("/api/advisor/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ intake: s.intake }),
      });
      const data = await res.json() as { sessionId?: string; error?: string };
      if (!res.ok || !data.sessionId) {
        setReEvalResult((prev) => ({ ...prev, [s.id]: `Error: ${data.error ?? "Failed"}` }));
      } else {
        setReEvalResult((prev) => ({ ...prev, [s.id]: data.sessionId! }));
      }
    } catch {
      setReEvalResult((prev) => ({ ...prev, [s.id]: "Error: Connection failed" }));
    } finally {
      setReEvaluating(null);
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
      {deleteError && <p className="text-red-400 text-xs mb-3">{deleteError}</p>}

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
              <InlineNotes id={s.id} endpoint="/api/admin/advisor" initial={s.adminNotes} />
              {reEvalResult[s.id] && (
                <div className="mt-2 text-xs">
                  {reEvalResult[s.id].startsWith("Error") ? (
                    <span className="text-red-400">{reEvalResult[s.id]}</span>
                  ) : (
                    <span className="text-green-400">
                      Re-evaluated · New report:{" "}
                      <a
                        href={`/advisor/report/${reEvalResult[s.id]}`}
                        target="_blank"
                        className="underline"
                      >
                        /advisor/report/{reEvalResult[s.id]}
                      </a>
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <p className="text-[#444] text-xs">{new Date(s.createdAt).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReEvaluate(s)}
                    disabled={reEvaluating === s.id}
                    className="text-xs text-[#666] hover:text-[#E8A838] transition disabled:opacity-50"
                  >
                    {reEvaluating === s.id ? "Re-evaluating…" : "Re-evaluate"}
                  </button>
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
  const [deleteError, setDeleteError] = useState("");

  const filtered = sessions.filter((s) =>
    (s.founderName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.country ?? "").toLowerCase().includes(search.toLowerCase()) ||
    s.overallVerdict.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setDeleteError("");
    try {
      const res = await fetch("/api/admin/pitch-deck", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      window.location.reload();
    } catch {
      setDeleteError("Failed to delete. Please try again.");
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
      {deleteError && <p className="text-red-400 text-xs mb-3">{deleteError}</p>}

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
              <InlineNotes id={s.id} endpoint="/api/admin/pitch-deck" initial={s.adminNotes} />
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
  days,
  dayCounts,
}: {
  readinessSessions: EnrichedSession[];
  advisorSessions: AdvisorSession[];
  pitchDeckSessions: PitchDeckSession[];
  days: string[];
  dayCounts: number[];
}) {
  const [tab, setTab] = useState<Tab>("Readiness Check");
  const [sitePaused, setSitePaused] = useState(false);
  const [siteControlLoading, setSiteControlLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-control", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (typeof d.paused === "boolean") setSitePaused(d.paused); })
      .catch(() => {});
  }, []);

  const handleSiteControl = async (action: string) => {
    setSiteControlLoading(true);
    try {
      const res = await fetch("/api/admin/site-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      if (typeof d.paused === "boolean") setSitePaused(d.paused);
    } catch {}
    setSiteControlLoading(false);
  };

  return (
    <div>
      {/* Site Control */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-white text-sm font-semibold">Site Status</p>
            <p className={`text-xs mt-0.5 ${sitePaused ? "text-red-400" : "text-green-400"}`}>
              {sitePaused ? "🔴 PAUSED — All evaluations blocked" : "🟢 LIVE — All services running"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleSiteControl(sitePaused ? "resume" : "pause")}
              disabled={siteControlLoading}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50 ${
                sitePaused ? "bg-green-600 hover:bg-green-500 text-white" : "bg-red-800/40 hover:bg-red-700/40 border border-red-800/50 text-red-400"
              }`}>
              {sitePaused ? "Resume Site" : "Pause Site"}
            </button>
            <button
              onClick={() => handleSiteControl("credit_alert")}
              disabled={siteControlLoading}
              className="text-xs px-3 py-1.5 rounded-lg border border-amber-800/50 text-amber-400 hover:bg-amber-900/20 transition disabled:opacity-50">
              🚨 Low Credit Alert
            </button>
          </div>
        </div>
      </div>

      <RevenueChart days={days} dayCounts={dayCounts} />
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
