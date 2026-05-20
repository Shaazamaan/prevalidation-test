"use client";

import { useState } from "react";
import Link from "next/link";
import type { Session, Report } from "@/lib/db";

type EnrichedSession = Session & { report: Report | null };

const VERDICT_BADGE: Record<string, string> = {
  READY: "bg-green-900/40 text-green-400 border-green-800",
  "CONDITIONALLY READY": "bg-amber-900/40 text-amber-400 border-amber-800",
  "NOT READY": "bg-red-900/40 text-red-400 border-red-800",
};

function exportCSV(sessions: EnrichedSession[]) {
  const headers = [
    "Name", "Startup Idea", "Startup Type", "Verdict", "Reality Score",
    "Status", "Created At", "Admin Notes",
  ];
  const rows = sessions.map((s) => [
    s.founderName,
    `"${(s.startupIdea ?? "").replace(/"/g, '""')}"`,
    s.startupType ?? "",
    s.report?.verdict ?? "",
    s.report?.realityScore ?? "",
    s.status,
    new Date(s.createdAt).toISOString(),
    `"${(s.adminNotes ?? "").replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sessions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminTable({ sessions }: { sessions: EnrichedSession[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const PER_PAGE = 20;

  const filtered = sessions.filter((s) => {
    const verdict = s.report?.verdict ?? "";
    const matchFilter =
      filter === "All" ||
      (filter === "In Progress" && s.status === "active") ||
      verdict === filter;
    const matchSearch =
      s.founderName.toLowerCase().includes(search.toLowerCase()) ||
      s.startupIdea.toLowerCase().includes(search.toLowerCase()) ||
      (s.startupType ?? "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch("/api/admin/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    setConfirmDelete(null);
    window.location.reload();
  };

  return (
    <div>
      {/* Search + Filter + Export */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name, idea, or type…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838]"
        />
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E8A838]"
        >
          <option>All</option>
          <option>READY</option>
          <option>CONDITIONALLY READY</option>
          <option>NOT READY</option>
          <option>In Progress</option>
        </select>
        <button
          onClick={() => exportCSV(filtered)}
          className="bg-[#111] border border-[#222] rounded-lg px-4 py-2 text-[#888] text-sm hover:text-white hover:border-[#444] transition"
        >
          Export CSV
        </button>
      </div>

      <p className="text-xs text-[#555] mb-3">{filtered.length} session{filtered.length !== 1 ? "s" : ""}</p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#222]">
        <table className="w-full text-sm">
          <thead className="bg-[#111] text-[#666] text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Founder</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Idea</th>
              <th className="px-4 py-3 text-left">Verdict</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Score</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Date</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {paginated.map((s) => (
              <tr key={s.id} className="bg-[#0d0d0d] hover:bg-[#111] transition">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-medium">{s.founderName}</p>
                    {s.startupType && (
                      <p className="text-[#444] text-xs mt-0.5">{s.startupType}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-[#888] max-w-xs hidden sm:table-cell">
                  <span className="line-clamp-2 text-xs">{s.startupIdea}</span>
                </td>
                <td className="px-4 py-3">
                  {s.report ? (
                    <span className={`inline-block border text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${VERDICT_BADGE[s.report.verdict] ?? ""}`}>
                      {s.report.verdict}
                    </span>
                  ) : s.status === "active" ? (
                    <div>
                      <span className="text-[#555] text-xs">In progress</span>
                      {s.lastActivePhase != null && (
                        <p className="text-[#E8A838] text-xs mt-0.5">Phase {s.lastActivePhase}/14</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-[#555] text-xs">No report</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#666] text-xs hidden md:table-cell">
                  {s.report?.realityScore != null ? `${s.report.realityScore}/100` : "—"}
                </td>
                <td className="px-4 py-3 text-[#666] text-xs hidden sm:table-cell">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 items-center">
                    <Link href={`/admin/session/${s.id}`} className="text-[#E8A838] hover:underline text-xs">
                      View
                    </Link>
                    <a href={`/api/export?sessionId=${s.id}`} className="text-[#666] hover:text-white text-xs transition">
                      PDF
                    </a>
                    <button
                      onClick={() => setConfirmDelete(s.id)}
                      className="text-red-600 hover:text-red-400 text-xs transition"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#555] text-sm">No sessions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded text-xs ${page === p ? "bg-[#E8A838] text-black" : "bg-[#111] text-[#666] hover:text-white"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-crimson text-lg text-white mb-2">Delete Session?</h3>
            <p className="text-[#888] text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={!!deleting}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-[#222] text-white py-2 rounded-lg text-sm hover:bg-[#333] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
