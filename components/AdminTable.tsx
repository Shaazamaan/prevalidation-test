"use client";

import { useState } from "react";
import Link from "next/link";
import type { Session, Report, PaymentRecord } from "@/lib/db";

type EnrichedSession = Session & { report: Report | null };

const VERDICT_BADGE: Record<string, string> = {
  READY: "bg-green-900/40 text-green-400 border-green-800",
  "CONDITIONALLY READY": "bg-amber-900/40 text-amber-400 border-amber-800",
  "NOT READY": "bg-red-900/40 text-red-400 border-red-800",
};

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function sanitizeCSVCell(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  const safe = /^[=+\-@\t\r]/.test(s) ? `\t${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

function exportCSV(sessions: EnrichedSession[]) {
  const headers = [
    "Name", "Email", "Phone", "Country", "Startup Idea", "Startup Type",
    "Verdict", "Reality Score", "Status",
    "Payment Type", "Amount (₹)", "Order ID", "Payment ID", "Coupon", "Mode",
    "Date", "Time", "Admin Notes",
  ];
  const rows = sessions.map((s) => {
    const p = s.payment;
    return [
      s.founderName, s.email ?? "", s.phone ?? "", s.country ?? "",
      s.startupIdea ?? "", s.startupType ?? "",
      s.report?.verdict ?? "", s.report?.realityScore ?? "", s.status,
      p ? (p.isAdmin ? "Admin" : p.isFree ? "Free" : "Paid") : "Unknown",
      p ? (p.amount / 100) : "",
      p?.orderId ?? "", p?.paymentId ?? "", p?.coupon ?? "", p?.mode ?? "",
      fmtDate(s.createdAt), fmtTime(s.createdAt),
      s.adminNotes ?? "",
    ];
  });
  const csv = ["﻿" + [headers, ...rows].map((r) => r.map(sanitizeCSVCell).join(",")).join("\n")];
  const blob = new Blob(csv, { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `readiness-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
      className="ml-1 text-[10px] text-[#444] hover:text-[#E8A838] transition"
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
}

function PaymentBadge({ payment }: { payment?: PaymentRecord }) {
  if (!payment || payment.isAdmin) return (
    <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-800/40 text-blue-400 bg-blue-900/10">ADMIN</span>
  );
  if (payment.isFree) return (
    <span className="text-[10px] px-1.5 py-0.5 rounded border border-green-800/40 text-green-400 bg-green-900/10">
      FREE{payment.coupon ? ` · ${payment.coupon}` : ""}
    </span>
  );
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#E8A838]/40 text-[#E8A838] bg-[#E8A838]/5">
      ₹{(payment.amount / 100).toLocaleString("en-IN")} · {payment.mode === "live" ? "LIVE" : "TEST"}
    </span>
  );
}

export default function AdminTable({ sessions }: { sessions: EnrichedSession[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<Record<string, boolean>>({});
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
      (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.phone ?? "").includes(search) ||
      (s.country ?? "").toLowerCase().includes(search.toLowerCase()) ||
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
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name, email, phone, idea…"
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
              <tr key={s.id} className="bg-[#0d0d0d] hover:bg-[#111] transition align-top">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-medium">{s.founderName}</p>
                    {s.email && <p className="text-[#555] text-xs mt-0.5">{s.email}</p>}
                    {s.phone && <p className="text-[#444] text-xs">{s.phone}</p>}
                    {s.country && <p className="text-[#444] text-xs">{s.country}</p>}
                    {s.startupType && (
                      <p className="text-[#444] text-xs mt-0.5 border-t border-[#1a1a1a] pt-0.5">{s.startupType}</p>
                    )}
                    <div className="mt-1.5">
                      <PaymentBadge payment={s.payment} />
                    </div>
                    {s.payment && !s.payment.isAdmin && s.payment.orderId && s.payment.orderId !== "ADMIN" && (
                      <button
                        onClick={() => setExpandedPayment((p) => ({ ...p, [s.id]: !p[s.id] }))}
                        className="text-[10px] text-[#444] hover:text-[#666] mt-1 transition block"
                      >
                        {expandedPayment[s.id] ? "▲ Hide" : "▼ IDs"}
                      </button>
                    )}
                    {expandedPayment[s.id] && s.payment && (
                      <div className="mt-1 space-y-0.5">
                        <div className="flex items-center">
                          <span className="text-[#333] text-[10px] w-12">Order</span>
                          <span className="text-[#555] text-[10px] font-mono truncate max-w-[120px]">{s.payment.orderId}</span>
                          <CopyButton text={s.payment.orderId} />
                        </div>
                        {s.payment.paymentId && s.payment.paymentId !== "FREE" && (
                          <div className="flex items-center">
                            <span className="text-[#333] text-[10px] w-12">Pay</span>
                            <span className="text-[#555] text-[10px] font-mono truncate max-w-[120px]">{s.payment.paymentId}</span>
                            <CopyButton text={s.payment.paymentId} />
                          </div>
                        )}
                      </div>
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
                  <div>{fmtDate(s.createdAt)}</div>
                  <div className="text-[#444] text-[10px]">{fmtTime(s.createdAt)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 items-center flex-wrap">
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
