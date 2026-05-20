"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminTable from "@/components/AdminTable";
import type { Session, Report, AdvisorSession, PitchDeckSession, PaymentRecord } from "@/lib/db";
import type { DashboardAnalytics } from "@/app/admin/dashboard/page";

// ── Utilities ────────────────────────────────────────────────────────────────

function fmtRs(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN");
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function sanitizeCSVCell(v: string | number): string {
  const s = String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `\t${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadCSV(rows: (string | number)[][], filename: string) {
  const csv = rows.map((r) => r.map(sanitizeCSVCell).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
      className="ml-1 text-[10px] text-[#444] hover:text-[#E8A838] transition"
      title="Copy"
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
}

// ── Payment badge ─────────────────────────────────────────────────────────────

function PaymentBadge({ payment }: { payment?: PaymentRecord }) {
  if (!payment) return (
    <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-800/40 text-blue-400 bg-blue-900/10">ADMIN</span>
  );
  if (payment.isAdmin) return (
    <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-800/40 text-blue-400 bg-blue-900/10">ADMIN</span>
  );
  if (payment.isFree) return (
    <span className="text-[10px] px-1.5 py-0.5 rounded border border-green-800/40 text-green-400 bg-green-900/10">
      FREE {payment.coupon ? `· ${payment.coupon}` : ""}
    </span>
  );
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#E8A838]/40 text-[#E8A838] bg-[#E8A838]/5">
      {fmtRs(payment.amount)} · {payment.mode === "live" ? "LIVE" : "TEST"}
    </span>
  );
}

function PaymentDetail({ payment }: { payment?: PaymentRecord }) {
  if (!payment || payment.isAdmin || !payment.orderId || payment.orderId === "ADMIN") return null;
  return (
    <div className="mt-2 pt-2 border-t border-[#1a1a1a] space-y-1">
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[#444] text-[10px] w-16 shrink-0">Order ID</span>
        <span className="text-[#666] text-[10px] font-mono break-all">{payment.orderId}</span>
        <CopyButton text={payment.orderId} />
      </div>
      {payment.paymentId && payment.paymentId !== "FREE" && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[#444] text-[10px] w-16 shrink-0">Payment ID</span>
          <span className="text-[#666] text-[10px] font-mono break-all">{payment.paymentId}</span>
          <CopyButton text={payment.paymentId} />
        </div>
      )}
      {payment.coupon && (
        <div className="flex items-center gap-1">
          <span className="text-[#444] text-[10px] w-16 shrink-0">Coupon</span>
          <span className="text-green-400 text-[10px] font-mono">{payment.coupon}</span>
        </div>
      )}
      {payment.paidAt && (
        <div className="flex items-center gap-1">
          <span className="text-[#444] text-[10px] w-16 shrink-0">Paid at</span>
          <span className="text-[#555] text-[10px]">{fmtDate(payment.paidAt)} {fmtTime(payment.paidAt)}</span>
        </div>
      )}
    </div>
  );
}

// ── Inline notes ──────────────────────────────────────────────────────────────

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
        <button onClick={() => setEditing(false)} className="text-xs px-2 py-1 text-[#444] hover:text-white">Cancel</button>
      </div>
    </div>
  );
}

// ── Badge maps ────────────────────────────────────────────────────────────────

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

// ── Mini bar chart ────────────────────────────────────────────────────────────

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
      <p className="text-xs text-[#555] uppercase mb-4">Activity — Last 7 Days</p>
      <div className="flex items-end gap-2 h-24">
        {dayCounts.map((count, i) => {
          const heightPct = Math.max((count / max) * 100, count > 0 ? 8 : 4);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {count > 0 && <span className="text-[10px] text-[#888]">{count}</span>}
              <div
                className="w-full rounded-t"
                style={{ height: `${heightPct}%`, background: count > 0 ? "#E8A838" : "#222", minHeight: 4 }}
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

// ── Master Export ─────────────────────────────────────────────────────────────

function exportMasterCSV(
  readiness: (Session & { report: Report | null })[],
  advisor: AdvisorSession[],
  pitchDeck: PitchDeckSession[]
) {
  const headers = [
    "Tool", "Session ID", "Date", "Time",
    "Name", "Email", "Phone", "Country",
    "Payment Type", "Amount (₹)", "Order ID", "Payment ID", "Coupon", "Mode",
    "Score / Verdict", "Admin Notes",
  ];

  const rows: (string | number)[][] = [];

  for (const s of readiness) {
    const p = s.payment;
    rows.push([
      "Readiness Check", s.id,
      fmtDate(s.createdAt), fmtTime(s.createdAt),
      s.founderName, s.email ?? "", s.phone ?? "", s.country ?? "",
      p ? (p.isAdmin ? "Admin" : p.isFree ? "Free" : "Paid") : "Unknown",
      p ? (p.amount / 100) : "",
      p?.orderId ?? "", p?.paymentId ?? "", p?.coupon ?? "", p?.mode ?? "",
      s.report?.verdict ? `${s.report.verdict} (${s.report.realityScore}/100)` : s.status,
      s.adminNotes ?? "",
    ]);
  }

  for (const s of advisor) {
    const p = s.payment;
    rows.push([
      "Advisor", s.id,
      fmtDate(s.createdAt), fmtTime(s.createdAt),
      s.founderName, s.email ?? "", s.phone ?? "", s.country ?? "",
      p ? (p.isAdmin ? "Admin" : p.isFree ? "Free" : "Paid") : "Unknown",
      p ? (p.amount / 100) : "",
      p?.orderId ?? "", p?.paymentId ?? "", p?.coupon ?? "", p?.mode ?? "",
      `${s.pathway} · ${s.overallScore}/100`,
      s.adminNotes ?? "",
    ]);
  }

  for (const s of pitchDeck) {
    const p = s.payment;
    rows.push([
      "Pitch Deck", s.id,
      fmtDate(s.createdAt), fmtTime(s.createdAt),
      s.founderName ?? "", s.email ?? "", s.phone ?? "", s.country ?? "",
      p ? (p.isAdmin ? "Admin" : p.isFree ? "Free" : "Paid") : "Unknown",
      p ? (p.amount / 100) : "",
      p?.orderId ?? "", p?.paymentId ?? "", p?.coupon ?? "", p?.mode ?? "",
      `DB ${s.dbScore} / GR ${s.grScore} · ${s.overallVerdict}`,
      s.adminNotes ?? "",
    ]);
  }

  rows.sort((a, b) => String(b[2]).localeCompare(String(a[2])));
  downloadCSV([headers, ...rows], `devbridge-all-sessions-${new Date().toISOString().slice(0, 10)}.csv`);
}

function exportAdvisorCSV(sessions: AdvisorSession[]) {
  const headers = ["Name", "Email", "Phone", "Country", "Pathway", "Pathway Label", "Overall Score", "Payment Type", "Amount (₹)", "Order ID", "Payment ID", "Coupon", "Mode", "Date", "Admin Notes"];
  const rows = sessions.map((s) => {
    const p = s.payment;
    return [
      s.founderName, s.email ?? "", s.phone ?? "", s.country ?? "",
      s.pathway, s.pathwayLabel, s.overallScore,
      p ? (p.isAdmin ? "Admin" : p.isFree ? "Free" : "Paid") : "Unknown",
      p ? (p.amount / 100) : "",
      p?.orderId ?? "", p?.paymentId ?? "", p?.coupon ?? "", p?.mode ?? "",
      fmtDate(s.createdAt),
      s.adminNotes ?? "",
    ];
  });
  downloadCSV([headers, ...rows], `advisor-sessions-${new Date().toISOString().slice(0, 10)}.csv`);
}

function exportPitchDeckCSV(sessions: PitchDeckSession[]) {
  const headers = ["Name", "Email", "Phone", "Country", "DB Score", "GR Score", "Verdict", "Payment Type", "Amount (₹)", "Order ID", "Payment ID", "Coupon", "Mode", "Date", "Admin Notes"];
  const rows = sessions.map((s) => {
    const p = s.payment;
    return [
      s.founderName ?? "", s.email ?? "", s.phone ?? "", s.country ?? "",
      s.dbScore, s.grScore, s.overallVerdict,
      p ? (p.isAdmin ? "Admin" : p.isFree ? "Free" : "Paid") : "Unknown",
      p ? (p.amount / 100) : "",
      p?.orderId ?? "", p?.paymentId ?? "", p?.coupon ?? "", p?.mode ?? "",
      fmtDate(s.createdAt),
      s.adminNotes ?? "",
    ];
  });
  downloadCSV([headers, ...rows], `pitchdeck-sessions-${new Date().toISOString().slice(0, 10)}.csv`);
}

// ── Analytics Overview ────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`bg-[#111] border rounded-xl p-4 ${accent ? "border-[#E8A838]/30" : "border-[#222]"}`}>
      <div className={`text-xl font-bold ${accent ? "text-[#E8A838]" : "text-white"}`}>{value}</div>
      <div className="text-xs text-[#555] mt-1">{label}</div>
      {sub && <div className="text-xs text-[#444] mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Push Notification Sender ──────────────────────────────────────────────────

function PushNotificationSender() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent?: number; failed?: number; total?: number; error?: string } | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/push-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim() }),
      });
      const d = await res.json() as typeof result;
      setResult(d);
    } catch {
      setResult({ error: "Network error." });
    }
    setSending(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-white text-sm font-semibold">Broadcast Push Notification</p>
      <p className="text-[#555] text-xs mb-2">Send to all users who installed the PWA and granted permission.</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. New feature live!)"
        className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-purple-600 transition"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message body…"
        rows={2}
        className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-purple-600 transition resize-none"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL to open on tap (e.g. /advisor)"
        className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-purple-600 transition"
      />
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim()}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg font-medium transition disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send Notification"}
        </button>
        {result && !result.error && (
          <p className="text-xs text-green-400">
            Sent to {result.sent}/{result.total} subscribers{result.failed ? ` (${result.failed} failed)` : ""}
          </p>
        )}
        {result?.error && <p className="text-xs text-red-400">{result.error}</p>}
      </div>
    </div>
  );
}

// ── Analytics Section ─────────────────────────────────────────────────────────

function AnalyticsSection({
  analytics,
  readiness,
  advisor,
  pitchDeck,
  days,
  dayCounts,
}: {
  analytics: DashboardAnalytics;
  readiness: (Session & { report: Report | null })[];
  advisor: AdvisorSession[];
  pitchDeck: PitchDeckSession[];
  days: string[];
  dayCounts: number[];
}) {
  const [rzpMode, setRzpMode] = useState<"test" | "live">(analytics.razorpayMode);
  const [rzpLoading, setRzpLoading] = useState(false);
  const [rzpError, setRzpError] = useState("");
  const [rzpSuccess, setRzpSuccess] = useState("");

  const toggleRzpMode = async (newMode: "test" | "live") => {
    if (newMode === rzpMode) return;
    setRzpLoading(true);
    setRzpError("");
    setRzpSuccess("");
    try {
      const res = await fetch("/api/admin/razorpay-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode: newMode }),
      });
      const d = await res.json() as { mode?: string; error?: string };
      if (!res.ok) { setRzpError(d.error ?? "Failed to update mode."); }
      else {
        setRzpMode(d.mode as "test" | "live");
        setRzpSuccess(`Switched to ${d.mode?.toUpperCase()} mode.`);
        setTimeout(() => setRzpSuccess(""), 3000);
      }
    } catch { setRzpError("Network error."); }
    setRzpLoading(false);
  };

  // ── Site + Tool controls ─────────────────────────────────────────────────
  const [sitePaused, setSitePaused] = useState(false);
  const [siteLoading, setSiteLoading] = useState(false);
  const [prices, setPrices] = useState({ readiness: 999, advisor: 999, pitchdeck: 999 });
  const [priceSaving, setPriceSaving] = useState<string | null>(null);
  const [priceSaved, setPriceSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-control", { credentials: "include" })
      .then((r) => r.json()).then((d) => { if (typeof d.paused === "boolean") setSitePaused(d.paused); }).catch(() => {});
    fetch("/api/admin/pricing", { credentials: "include" })
      .then((r) => r.json())
      .then((d: Record<string, number>) => {
        setPrices({
          readiness: (d.readiness ?? 99900) / 100,
          advisor: (d.advisor ?? 99900) / 100,
          pitchdeck: (d.pitchdeck ?? 99900) / 100,
        });
      }).catch(() => {});
  }, []);

  const handleSiteControl = async (action: string) => {
    setSiteLoading(true);
    try {
      const res = await fetch("/api/admin/site-control", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      if (typeof d.paused === "boolean") setSitePaused(d.paused);
    } catch {}
    setSiteLoading(false);
  };

  const handlePriceUpdate = async (tool: string, amountRupees: number) => {
    setPriceSaving(tool);
    try {
      await fetch("/api/admin/pricing", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ tool, amountRupees }),
      });
      setPriceSaved(tool);
      setTimeout(() => setPriceSaved(null), 2000);
    } catch {}
    setPriceSaving(null);
  };

  const funnel = analytics.readinessCreated > 0
    ? Math.round((analytics.readinessCompleted / analytics.readinessCreated) * 100)
    : 0;

  const avgRevenue = analytics.completedSessions > 0
    ? Math.round(analytics.totalRevenuePaise / analytics.completedSessions / 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div>
        <p className="text-xs text-[#444] uppercase tracking-widest mb-3">Revenue</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <StatCard label="Total Revenue" value={`₹${(analytics.totalRevenuePaise / 100).toLocaleString("en-IN")}`} accent />
          <StatCard label="This Month" value={`₹${(analytics.thisMonthRevenuePaise / 100).toLocaleString("en-IN")}`} />
          <StatCard label="Avg per Report" value={`₹${avgRevenue.toLocaleString("en-IN")}`} />
          <StatCard label="This Week" value={String(analytics.thisWeekTotal)} sub="sessions" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#111] border border-[#222] rounded-xl p-3">
            <div className="text-base font-bold text-[#E8A838]">₹{(analytics.revenueByTool.readiness / 100).toLocaleString("en-IN")}</div>
            <div className="text-[10px] text-[#555] mt-0.5">Readiness Check</div>
            <div className="mt-1.5 h-0.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-[#E8A838] rounded-full" style={{ width: analytics.totalRevenuePaise > 0 ? `${(analytics.revenueByTool.readiness / analytics.totalRevenuePaise) * 100}%` : "0%" }} />
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-3">
            <div className="text-base font-bold text-blue-400">₹{(analytics.revenueByTool.advisor / 100).toLocaleString("en-IN")}</div>
            <div className="text-[10px] text-[#555] mt-0.5">Advisor</div>
            <div className="mt-1.5 h-0.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: analytics.totalRevenuePaise > 0 ? `${(analytics.revenueByTool.advisor / analytics.totalRevenuePaise) * 100}%` : "0%" }} />
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-3">
            <div className="text-base font-bold text-green-400">₹{(analytics.revenueByTool.pitchdeck / 100).toLocaleString("en-IN")}</div>
            <div className="text-[10px] text-[#555] mt-0.5">Pitch Deck</div>
            <div className="mt-1.5 h-0.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: analytics.totalRevenuePaise > 0 ? `${(analytics.revenueByTool.pitchdeck / analytics.totalRevenuePaise) * 100}%` : "0%" }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-3 py-2 text-center">
            <div className="text-sm font-bold text-white">{analytics.paidCount}</div>
            <div className="text-[10px] text-[#555]">Paid</div>
          </div>
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-3 py-2 text-center">
            <div className="text-sm font-bold text-green-400">{analytics.freeCount}</div>
            <div className="text-[10px] text-[#555]">Free (coupon)</div>
          </div>
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-3 py-2 text-center">
            <div className="text-sm font-bold text-blue-400">{analytics.adminCount}</div>
            <div className="text-[10px] text-[#555]">Admin</div>
          </div>
        </div>
      </div>

      {/* Funnel */}
      <div>
        <p className="text-xs text-[#444] uppercase tracking-widest mb-3">Conversion Funnel</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <p className="text-[#555] text-xs mb-2">Readiness Check</p>
            <div className="flex items-end gap-3">
              <div>
                <div className="text-2xl font-bold text-white">{analytics.readinessCreated}</div>
                <div className="text-[10px] text-[#555]">started</div>
              </div>
              <div className="text-[#333] text-lg">→</div>
              <div>
                <div className="text-2xl font-bold text-[#E8A838]">{analytics.readinessCompleted}</div>
                <div className="text-[10px] text-[#555]">completed</div>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-[#E8A838] rounded-full transition-all" style={{ width: `${funnel}%` }} />
            </div>
            <p className="text-[10px] text-[#555] mt-1">
              {funnel}% completion · {analytics.readinessCreated - analytics.readinessCompleted} abandoned
            </p>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <p className="text-[#555] text-xs mb-2">Advisor Reports</p>
            <div className="text-2xl font-bold text-blue-400">{analytics.advisorCount}</div>
            <div className="text-[10px] text-[#555] mt-0.5">completed evaluations</div>
            <div className="mt-3 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: analytics.totalSessions > 0 ? `${(analytics.advisorCount / analytics.totalSessions) * 100}%` : "0%" }} />
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <p className="text-[#555] text-xs mb-2">Pitch Deck Reports</p>
            <div className="text-2xl font-bold text-green-400">{analytics.pitchDeckCount}</div>
            <div className="text-[10px] text-[#555] mt-0.5">completed evaluations</div>
            <div className="mt-3 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: analytics.totalSessions > 0 ? `${(analytics.pitchDeckCount / analytics.totalSessions) * 100}%` : "0%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Repeat Users */}
      {analytics.repeatUsers.length > 0 && (
        <div>
          <p className="text-xs text-[#444] uppercase tracking-widest mb-3">
            Repeat Users — {analytics.repeatUsers.length} user{analytics.repeatUsers.length !== 1 ? "s" : ""} used multiple tools
          </p>
          <div className="space-y-2">
            {analytics.repeatUsers.map((u) => (
              <div key={u.email} className="bg-[#111] border border-[#E8A838]/20 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-white text-sm font-medium">{u.name || u.email}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-[#555] text-xs">{u.email}</p>
                      {u.phone && <p className="text-[#444] text-xs">· {u.phone}</p>}
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {u.tools.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[#888]">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[#E8A838] font-bold text-sm">{fmtRs(u.totalSpend)}</p>
                    <p className="text-[#555] text-xs mt-0.5">{u.sessionCount} sessions</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Countries */}
      {analytics.countries.length > 0 && (
        <div>
          <p className="text-xs text-[#444] uppercase tracking-widest mb-3">Geography — {analytics.countries.length} countries</p>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
              {analytics.countries.map((c) => (
                <div key={c.country} className="flex items-center justify-between">
                  <span className="text-[#888] text-xs truncate">{c.country}</span>
                  <span className="text-[#555] text-xs font-mono ml-2 shrink-0">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Coupons */}
      {analytics.couponStats.length > 0 && (
        <div>
          <p className="text-xs text-[#444] uppercase tracking-widest mb-3">Coupon Usage</p>
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left text-[#444] font-medium px-4 py-2.5">Code</th>
                  <th className="text-center text-[#444] font-medium px-3 py-2.5">Used</th>
                  <th className="text-left text-[#444] font-medium px-4 py-2.5">Emails</th>
                </tr>
              </thead>
              <tbody>
                {analytics.couponStats.map((c) => (
                  <tr key={c.code} className="border-b border-[#111] last:border-0 hover:bg-[#111]">
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[#E8A838] text-xs">{c.code}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-white font-medium">{c.count}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {c.emails.slice(0, 5).map((e) => (
                          <span key={e} className="text-[#555] text-[10px] bg-[#1a1a1a] px-1.5 py-0.5 rounded">{e}</span>
                        ))}
                        {c.emails.length > 5 && <span className="text-[#444] text-[10px]">+{c.emails.length - 5} more</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PWA + Push */}
      <div className="bg-[#111] border border-purple-800/30 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#1a1a1a]">
          <span className="text-2xl">📱</span>
          <div>
            <div className="text-xl font-bold text-purple-400">{analytics.pwaInstalls}</div>
            <div className="text-xs text-[#555]">PWA Installs · Push subscribers</div>
          </div>
        </div>
        <PushNotificationSender />
      </div>

      {/* Chart */}
      <RevenueChart days={days} dayCounts={dayCounts} />

      {/* Razorpay Mode Toggle */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white text-sm font-semibold">Razorpay Payment Mode</p>
            <p className="text-[#555] text-xs mt-0.5">
              {rzpMode === "live"
                ? "🟢 LIVE — Real payments active"
                : "🔵 TEST — Using test keys, no real money"}
            </p>
            {rzpError && <p className="text-red-400 text-xs mt-1">{rzpError}</p>}
            {rzpSuccess && <p className="text-green-400 text-xs mt-1">{rzpSuccess}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggleRzpMode("test")}
              disabled={rzpLoading}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition disabled:opacity-50 ${
                rzpMode === "test"
                  ? "bg-blue-900/30 border-blue-700 text-blue-300"
                  : "border-[#333] text-[#666] hover:border-blue-700 hover:text-blue-400"
              }`}
            >
              {rzpMode === "test" ? "✓ Test Mode" : "Test Mode"}
            </button>
            <button
              onClick={() => toggleRzpMode("live")}
              disabled={rzpLoading}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition disabled:opacity-50 ${
                rzpMode === "live"
                  ? "bg-green-900/30 border-green-700 text-green-300"
                  : "border-[#333] text-[#666] hover:border-green-700 hover:text-green-400"
              }`}
            >
              {rzpMode === "live" ? "✓ Live Mode" : "Go Live"}
            </button>
          </div>
        </div>
        {rzpMode === "live" && (
          <p className="text-amber-400/80 text-xs mt-3 bg-amber-900/10 border border-amber-800/30 rounded-lg px-3 py-2">
            ⚠ Live mode is active. Real payments will be charged. Ensure RAZORPAY_LIVE_KEY_ID and RAZORPAY_LIVE_KEY_SECRET are set in Vercel environment variables.
          </p>
        )}
        {rzpMode === "test" && (
          <p className="text-[#444] text-xs mt-3">
            Switch to Live mode once your Razorpay account is activated and live keys are added to Vercel.
          </p>
        )}
      </div>

      {/* Site Control & Pricing */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-4">
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
              disabled={siteLoading}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50 ${
                sitePaused ? "bg-green-600 hover:bg-green-500 text-white" : "bg-red-800/40 hover:bg-red-700/40 border border-red-800/50 text-red-400"
              }`}>
              {sitePaused ? "Resume Site" : "Pause Site"}
            </button>
            <button
              onClick={() => handleSiteControl("credit_alert")}
              disabled={siteLoading}
              className="text-xs px-3 py-1.5 rounded-lg border border-amber-800/50 text-amber-400 hover:bg-amber-900/20 transition disabled:opacity-50">
              🚨 Low Credit Alert
            </button>
          </div>
        </div>
      </div>

      {/* Tool Pricing */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-4">
        <p className="text-white text-sm font-semibold mb-4">Tool Pricing</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["readiness", "advisor", "pitchdeck"] as const).map((tool) => {
            const label = tool === "readiness" ? "Readiness Check" : tool === "advisor" ? "Advisor Report" : "Pitch Deck";
            const val = prices[tool];
            return (
              <div key={tool} className="bg-[#0d0d0d] border border-[#222] rounded-lg p-3">
                <p className="text-[#666] text-xs uppercase tracking-wide mb-2">{label}</p>
                <div className="flex gap-2 items-center">
                  <span className="text-[#555] text-sm">₹</span>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={val}
                    onChange={(e) => setPrices((p) => ({ ...p, [tool]: Number(e.target.value) }))}
                    className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#E8A838] transition w-0"
                  />
                  <button
                    onClick={() => handlePriceUpdate(tool, val)}
                    disabled={priceSaving === tool}
                    className="text-xs px-2 py-1.5 bg-[#E8A838] text-black rounded-lg font-medium hover:bg-[#d4962e] transition disabled:opacity-50 shrink-0">
                    {priceSaving === tool ? "…" : priceSaved === tool ? "✓" : "Save"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[#333] text-xs mt-3">Changes take effect immediately for all new payments.</p>
      </div>

      {/* Master Export */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => exportMasterCSV(readiness, advisor, pitchDeck)}
          className="flex-1 sm:flex-none flex items-center gap-2 justify-center bg-[#1a1a1a] border border-[#333] hover:border-[#E8A838]/50 text-[#888] hover:text-white px-4 py-2.5 rounded-xl text-sm transition font-medium"
        >
          📥 Export All Sessions + Payments
        </button>
        <button
          onClick={() => exportAdvisorCSV(advisor)}
          className="flex-1 sm:flex-none text-xs px-3 py-2.5 border border-[#222] text-[#555] rounded-xl hover:text-white hover:border-[#333] transition"
        >
          Advisor CSV
        </button>
        <button
          onClick={() => exportPitchDeckCSV(pitchDeck)}
          className="flex-1 sm:flex-none text-xs px-3 py-2.5 border border-[#222] text-[#555] rounded-xl hover:text-white hover:border-[#333] transition"
        >
          Pitch Deck CSV
        </button>
      </div>
    </div>
  );
}

// ── Advisor Sessions Table ────────────────────────────────────────────────────

function AdvisorSessionsTable({ sessions }: { sessions: AdvisorSession[] }) {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [reEvaluating, setReEvaluating] = useState<string | null>(null);
  const [reEvalResult, setReEvalResult] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = sessions.filter((s) =>
    s.founderName.toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.country ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.phone ?? "").includes(search)
  );

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setDeleteError("");
    try {
      const res = await fetch("/api/admin/advisor", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      window.location.reload();
    } catch { setDeleteError("Failed to delete. Please try again."); }
    finally { setDeleting(null); setConfirmDelete(null); }
  };

  const handleReEvaluate = async (s: AdvisorSession) => {
    setReEvaluating(s.id);
    try {
      const res = await fetch("/api/advisor/evaluate", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ intake: s.intake }),
      });
      const data = await res.json() as { sessionId?: string; error?: string };
      if (!res.ok || !data.sessionId) {
        setReEvalResult((prev) => ({ ...prev, [s.id]: `Error: ${data.error ?? "Failed"}` }));
      } else {
        setReEvalResult((prev) => ({ ...prev, [s.id]: data.sessionId! }));
      }
    } catch { setReEvalResult((prev) => ({ ...prev, [s.id]: "Error: Connection failed" })); }
    finally { setReEvaluating(null); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, country…"
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium text-sm">{s.founderName}</p>
                    <PaymentBadge payment={s.payment} />
                  </div>
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

              {/* Payment details toggle */}
              {s.payment && !s.payment.isAdmin && (
                <button
                  onClick={() => setExpanded((p) => ({ ...p, [s.id]: !p[s.id] }))}
                  className="text-[10px] text-[#444] hover:text-[#888] mt-1 transition"
                >
                  {expanded[s.id] ? "▲ Hide payment" : "▼ Payment details"}
                </button>
              )}
              {expanded[s.id] && <PaymentDetail payment={s.payment} />}

              <InlineNotes id={s.id} endpoint="/api/admin/advisor" initial={s.adminNotes} />
              {reEvalResult[s.id] && (
                <div className="mt-2 text-xs">
                  {reEvalResult[s.id].startsWith("Error") ? (
                    <span className="text-red-400">{reEvalResult[s.id]}</span>
                  ) : (
                    <span className="text-green-400">
                      Re-evaluated ·{" "}
                      <a href={`/advisor/report/${reEvalResult[s.id]}`} target="_blank" className="underline">
                        View new report
                      </a>
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <p className="text-[#444] text-xs">{fmtDate(s.createdAt)} · {fmtTime(s.createdAt)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReEvaluate(s)}
                    disabled={reEvaluating === s.id}
                    className="text-xs text-[#666] hover:text-[#E8A838] transition disabled:opacity-50"
                  >
                    {reEvaluating === s.id ? "Re-evaluating…" : "Re-evaluate"}
                  </button>
                  <Link href={`/advisor/report/${s.id}`} target="_blank" className="text-xs text-[#E8A838] hover:underline">
                    View Report ↗
                  </Link>
                  {confirmDelete === s.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} className="text-xs text-red-400 hover:text-red-300">
                        {deleting === s.id ? "Deleting…" : "Confirm"}
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-[#555] hover:text-white">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(s.id)} className="text-xs text-[#444] hover:text-red-400">Delete</button>
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

// ── Pitch Deck Sessions Table ─────────────────────────────────────────────────

function PitchDeckSessionsTable({ sessions }: { sessions: PitchDeckSession[] }) {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = sessions.filter((s) =>
    (s.founderName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.country ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.phone ?? "").includes(search) ||
    s.overallVerdict.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setDeleteError("");
    try {
      const res = await fetch("/api/admin/pitch-deck", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      window.location.reload();
    } catch { setDeleteError("Failed to delete. Please try again."); }
    finally { setDeleting(null); setConfirmDelete(null); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, country, verdict…"
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium text-sm">{s.founderName ?? "—"}</p>
                    <PaymentBadge payment={s.payment} />
                  </div>
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

              {s.payment && !s.payment.isAdmin && (
                <button
                  onClick={() => setExpanded((p) => ({ ...p, [s.id]: !p[s.id] }))}
                  className="text-[10px] text-[#444] hover:text-[#888] mt-1 transition"
                >
                  {expanded[s.id] ? "▲ Hide payment" : "▼ Payment details"}
                </button>
              )}
              {expanded[s.id] && <PaymentDetail payment={s.payment} />}

              <InlineNotes id={s.id} endpoint="/api/admin/pitch-deck" initial={s.adminNotes} />
              <div className="flex items-center justify-between mt-3">
                <p className="text-[#444] text-xs">{fmtDate(s.createdAt)} · {fmtTime(s.createdAt)}</p>
                <div className="flex gap-2">
                  <Link href={`/pitch-deck/report/${s.id}`} target="_blank" className="text-xs text-[#E8A838] hover:underline">
                    View Report ↗
                  </Link>
                  {confirmDelete === s.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} className="text-xs text-red-400 hover:text-red-300">
                        {deleting === s.id ? "Deleting…" : "Confirm"}
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-[#555] hover:text-white">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(s.id)} className="text-xs text-[#444] hover:text-red-400">Delete</button>
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

// ── Main Dashboard Client ─────────────────────────────────────────────────────

type EnrichedSession = Session & { report: Report | null };
const TABS = ["Overview", "Readiness Check", "Advisor", "Pitch Deck"] as const;
type Tab = typeof TABS[number];

export default function AdminDashboardClient({
  readinessSessions,
  advisorSessions,
  pitchDeckSessions,
  analytics,
  days,
  dayCounts,
}: {
  readinessSessions: EnrichedSession[];
  advisorSessions: AdvisorSession[];
  pitchDeckSessions: PitchDeckSession[];
  analytics: DashboardAnalytics;
  days: string[];
  dayCounts: number[];
}) {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#1a1a1a] overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px shrink-0 ${
              tab === t
                ? "border-[#E8A838] text-[#E8A838]"
                : "border-transparent text-[#555] hover:text-white"
            }`}
          >
            {t}
            {t !== "Overview" && (
              <span className="ml-1.5 text-xs opacity-60">
                {t === "Readiness Check" ? readinessSessions.length
                  : t === "Advisor" ? advisorSessions.length
                  : pitchDeckSessions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <AnalyticsSection
          analytics={analytics}
          readiness={readinessSessions}
          advisor={advisorSessions}
          pitchDeck={pitchDeckSessions}
          days={days}
          dayCounts={dayCounts}
        />
      )}
      {tab === "Readiness Check" && <AdminTable sessions={readinessSessions} />}
      {tab === "Advisor" && <AdvisorSessionsTable sessions={advisorSessions} />}
      {tab === "Pitch Deck" && <PitchDeckSessionsTable sessions={pitchDeckSessions} />}
    </div>
  );
}
