"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminTable from "@/components/AdminTable";
import type { Session, Report, AdvisorSession, PitchDeckSession, PaymentRecord, AdminCoupon } from "@/lib/db";
import type { DashboardAnalytics, AgentDashData } from "@/app/admin/dashboard/page";

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
  const [pauseUntilHours, setPauseUntilHours] = useState("");
  const [pauseUntilDisplay, setPauseUntilDisplay] = useState<number | null>(null);
  const [prices, setPrices] = useState({ readiness: 999, advisor: 999, pitchdeck: 999, pitch_practice: 2999 });
  const [priceSaving, setPriceSaving] = useState<string | null>(null);
  const [priceSaved, setPriceSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-control", { credentials: "include" })
      .then((r) => r.json()).then((d: { paused?: boolean; pauseUntil?: number }) => {
        if (typeof d.paused === "boolean") setSitePaused(d.paused);
        if (d.pauseUntil) setPauseUntilDisplay(d.pauseUntil);
      }).catch(() => {});
    fetch("/api/admin/pricing", { credentials: "include" })
      .then((r) => r.json())
      .then((d: Record<string, number>) => {
        setPrices({
          readiness: (d.readiness ?? 99900) / 100,
          advisor: (d.advisor ?? 99900) / 100,
          pitchdeck: (d.pitchdeck ?? 99900) / 100,
          pitch_practice: (d.pitch_practice ?? 299900) / 100,
        });
      }).catch(() => {});
  }, []);

  const handleSiteControl = async (action: string) => {
    setSiteLoading(true);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "pause" && pauseUntilHours) {
        body.pauseUntil = Date.now() + parseFloat(pauseUntilHours) * 3600 * 1000;
      }
      const res = await fetch("/api/admin/site-control", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(body),
      });
      const d = await res.json() as { paused?: boolean; pauseUntil?: number };
      if (typeof d.paused === "boolean") setSitePaused(d.paused);
      if (action === "resume") { setPauseUntilDisplay(null); setPauseUntilHours(""); }
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
      <div className="bg-[#111] border border-[#222] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-white text-sm font-semibold">Site Status</p>
            <p className={`text-xs mt-0.5 ${sitePaused ? "text-red-400" : "text-green-400"}`}>
              {sitePaused ? "🔴 PAUSED — All evaluations blocked" : "🟢 LIVE — All services running"}
            </p>
            {sitePaused && pauseUntilDisplay && (
              <p className="text-amber-400 text-xs mt-0.5">
                Auto-resumes: {new Date(pauseUntilDisplay).toLocaleString("en-IN")}
              </p>
            )}
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
        {!sitePaused && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#1a1a1a]">
            <span className="text-[#444] text-xs">Auto-unpause after:</span>
            <input
              type="number"
              min={1}
              value={pauseUntilHours}
              onChange={(e) => setPauseUntilHours(e.target.value)}
              placeholder="hours (blank = manual)"
              className="w-40 bg-[#0d0d0d] border border-[#333] rounded-lg px-2 py-1 text-white text-xs placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition"
            />
            <span className="text-[#333] text-xs">hours</span>
          </div>
        )}
      </div>

      {/* Tool Pricing */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-4">
        <p className="text-white text-sm font-semibold mb-4">Tool Pricing</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {(["readiness", "advisor", "pitchdeck", "pitch_practice"] as const).map((tool) => {
            const label = tool === "readiness" ? "Readiness Check" : tool === "advisor" ? "Advisor Report" : tool === "pitchdeck" ? "Pitch Deck" : "Pitch Practice";
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

// ── Agents Tab ────────────────────────────────────────────────────────────────

function AgentsTab({
  initialData,
  initialSubPrice,
  initialPlanId,
}: {
  initialData: AgentDashData[];
  initialSubPrice: number;
  initialPlanId: string | null;
}) {
  const [agents, setAgents] = useState<AgentDashData[]>(initialData);
  const [subPrice, setSubPrice] = useState(Math.round(initialSubPrice / 100));
  const [planId, setPlanId] = useState<string | null>(initialPlanId);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [msgInputs, setMsgInputs] = useState<Record<string, string>>({});
  const [msgSending, setMsgSending] = useState<string | null>(null);
  const [maxDiscountEdits, setMaxDiscountEdits] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notesEditing, setNotesEditing] = useState<string | null>(null);
  const [notesInputs, setNotesInputs] = useState<Record<string, string>>({});

  const pending = agents.filter((a) => a.profile.status === "pending");
  const active = agents.filter((a) => a.profile.status === "active").sort((a, b) => b.revenue - a.revenue);
  const banned = agents.filter((a) => a.profile.status === "banned");

  const refreshAgents = async () => {
    try {
      const res = await fetch("/api/admin/agents", { credentials: "include" });
      const d = await res.json() as { agents?: AgentDashData[] };
      if (d.agents) setAgents(d.agents);
    } catch {}
  };

  const doAction = async (email: string, action: string, value?: unknown) => {
    setActionLoading(`${email}-${action}`);
    try {
      await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, action, value }),
      });
      setAgents((prev) => prev.map((a) => {
        if (a.profile.email !== email) return a;
        const p = { ...a.profile };
        if (action === "approve") { p.status = "active"; p.approvedAt = Date.now(); }
        if (action === "ban") { p.status = "banned"; p.bannedAt = Date.now(); }
        if (action === "unban") { p.status = "active"; p.bannedAt = undefined; }
        if (action === "set_sub") p.subscriptionStatus = value as "active" | "inactive";
        if (action === "set_max_discount") p.maxCouponDiscount = Number(value);
        if (action === "set_notes") p.adminNotes = String(value ?? "");
        return { ...a, profile: p };
      }));
    } catch {}
    setActionLoading(null);
  };

  const sendMessage = async (email: string) => {
    const body = msgInputs[email]?.trim();
    if (!body) return;
    setMsgSending(email);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, message: body }),
      });
      const d = await res.json() as { messages?: { id: string; body: string; sentAt: number; readAt?: number }[] };
      setMsgInputs((p) => ({ ...p, [email]: "" }));
      if (d.messages) {
        setAgents((prev) => prev.map((a) =>
          a.profile.email === email ? { ...a, messages: d.messages! } : a
        ));
      }
    } catch {}
    setMsgSending(null);
  };

  const saveSubPrice = async () => {
    setPriceLoading(true);
    try {
      await fetch("/api/admin/agent-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "set_price", amountRupees: subPrice }),
      });
      setPriceSaved(true);
      setTimeout(() => setPriceSaved(false), 2000);
    } catch {}
    setPriceLoading(false);
  };

  const createPlan = async () => {
    setPlanLoading(true);
    setPlanError("");
    try {
      const res = await fetch("/api/admin/agent-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "create_plan" }),
      });
      const d = await res.json() as { success?: boolean; planId?: string; error?: string };
      if (!res.ok) setPlanError(d.error ?? "Failed");
      else if (d.planId) setPlanId(d.planId);
    } catch { setPlanError("Network error."); }
    setPlanLoading(false);
  };

  function AgentCard({ a }: { a: AgentDashData }) {
    const { profile: p } = a;
    const unread = a.messages.filter((m) => !m.readAt).length;
    const isExpanded = !!expanded[p.email];

    return (
      <div className={`bg-[#111] border rounded-xl p-4 ${p.status === "pending" ? "border-amber-800/30" : p.status === "banned" ? "border-red-800/20 opacity-60" : "border-[#222]"}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-semibold text-sm">{p.name}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${p.status === "active" ? "border-green-800 text-green-400" : p.status === "banned" ? "border-red-800 text-red-400" : "border-amber-800 text-amber-400"}`}>
                {p.status}
              </span>
              {p.subscriptionStatus === "active" && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-900/20 border border-blue-800 text-blue-400 rounded-full">Sub Active</span>
              )}
            </div>
            <p className="text-[#555] text-xs mt-0.5">{p.email} · {p.phone}</p>
            {p.bio && <p className="text-[#444] text-xs mt-0.5 italic">{p.bio}</p>}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs text-[#E8A838] font-medium">₹{(a.revenue / 100).toLocaleString("en-IN")}</span>
              <span className="text-xs text-[#555]">{a.clientCount} client{a.clientCount !== 1 ? "s" : ""}</span>
              <span className="text-xs text-[#444] font-mono">{p.agentCode}</span>
              <span className="text-xs text-[#444]">Max {p.maxCouponDiscount}%</span>
              {unread > 0 && <span className="text-[10px] bg-[#E8A838] text-black px-1.5 py-0.5 rounded-full font-bold">{unread} unread</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {p.status === "pending" && (
              <div className="flex gap-1.5">
                <button onClick={() => doAction(p.email, "approve")} disabled={actionLoading === `${p.email}-approve`} className="text-xs px-2.5 py-1 bg-green-700 hover:bg-green-600 text-white rounded-lg transition disabled:opacity-50">Approve</button>
                <button onClick={() => doAction(p.email, "ban")} disabled={actionLoading === `${p.email}-ban`} className="text-xs px-2.5 py-1 bg-red-800/50 hover:bg-red-700/50 border border-red-800 text-red-400 rounded-lg transition disabled:opacity-50">Deny</button>
              </div>
            )}
            {p.status === "active" && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => doAction(p.email, "set_sub", p.subscriptionStatus === "active" ? "inactive" : "active")}
                  disabled={!!actionLoading}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition disabled:opacity-50 ${p.subscriptionStatus === "active" ? "border-blue-800 text-blue-400 hover:bg-blue-900/20" : "border-[#333] text-[#666] hover:text-blue-400 hover:border-blue-800"}`}
                >
                  {p.subscriptionStatus === "active" ? "Sub: Active" : "Sub: Off"}
                </button>
                <button onClick={() => doAction(p.email, "ban")} disabled={!!actionLoading} className="text-xs px-2.5 py-1 border border-red-900 text-red-500 hover:bg-red-900/20 rounded-lg transition disabled:opacity-50">Ban</button>
              </div>
            )}
            {p.status === "banned" && (
              <button onClick={() => doAction(p.email, "unban")} disabled={!!actionLoading} className="text-xs px-2.5 py-1 border border-green-900 text-green-500 hover:bg-green-900/20 rounded-lg transition disabled:opacity-50">Unban</button>
            )}
            <button onClick={() => setExpanded((e) => ({ ...e, [p.email]: !e[p.email] }))} className="text-[10px] text-[#444] hover:text-white transition">
              {isExpanded ? "▲ Collapse" : "▼ Details"}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4 border-t border-[#1a1a1a] pt-4">
            {/* Max coupon discount */}
            <div className="flex items-center gap-2">
              <span className="text-[#555] text-xs">Max Coupon %:</span>
              <input
                type="number" min={1} max={40}
                value={maxDiscountEdits[p.email] ?? String(p.maxCouponDiscount)}
                onChange={(e) => setMaxDiscountEdits((x) => ({ ...x, [p.email]: e.target.value }))}
                className="w-16 bg-[#0d0d0d] border border-[#333] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#E8A838]"
              />
              <button
                onClick={() => doAction(p.email, "set_max_discount", parseInt(maxDiscountEdits[p.email] ?? String(p.maxCouponDiscount)))}
                disabled={!!actionLoading}
                className="text-xs px-2 py-1 bg-[#E8A838] text-black rounded font-medium transition disabled:opacity-50"
              >
                Save
              </button>
            </div>

            {/* Admin notes */}
            {notesEditing === p.email ? (
              <div className="flex gap-2 items-start">
                <textarea
                  value={notesInputs[p.email] ?? (p.adminNotes ?? "")}
                  onChange={(e) => setNotesInputs((x) => ({ ...x, [p.email]: e.target.value }))}
                  rows={2}
                  placeholder="Admin notes…"
                  autoFocus
                  className="flex-1 text-xs bg-[#0d0d0d] border border-[#333] rounded-lg px-2 py-1.5 text-[#888] placeholder-[#444] focus:outline-none focus:border-[#E8A838] resize-none"
                />
                <div className="flex flex-col gap-1">
                  <button onClick={() => { doAction(p.email, "set_notes", notesInputs[p.email] ?? ""); setNotesEditing(null); }} className="text-xs px-2 py-1 bg-[#E8A838] text-black rounded font-medium">Save</button>
                  <button onClick={() => setNotesEditing(null)} className="text-xs px-2 py-1 text-[#444] hover:text-white">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setNotesInputs((x) => ({ ...x, [p.email]: p.adminNotes ?? "" })); setNotesEditing(p.email); }} className={`text-xs text-left w-full ${p.adminNotes ? "text-[#888]" : "text-[#444] hover:text-[#666]"} transition`}>
                {p.adminNotes ? `📝 ${p.adminNotes}` : "+ Admin notes"}
              </button>
            )}

            {/* Clients */}
            {a.clients.length > 0 && (
              <div>
                <p className="text-[#444] text-xs mb-2 uppercase tracking-wide">Clients ({a.clients.length})</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {[...a.clients].sort((x, y) => y.createdAt - x.createdAt).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs gap-2">
                      <span className="text-[#888] truncate">{c.clientName ?? c.clientEmail ?? "—"}</span>
                      <div className="flex items-center gap-2 text-[#555] shrink-0">
                        <span className="text-[10px] bg-[#1a1a1a] px-1.5 py-0.5 rounded capitalize">{c.tool}</span>
                        <span className="text-[#E8A838] font-medium">₹{(c.amount / 100).toLocaleString("en-IN")}</span>
                        <span>{fmtDate(c.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div>
              <p className="text-[#444] text-xs mb-2 uppercase tracking-wide">Messages</p>
              {a.messages.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto mb-2">
                  {[...a.messages].reverse().map((m) => (
                    <div key={m.id} className="text-xs">
                      <span className="text-[#888]">{m.body}</span>
                      <span className="text-[#444] ml-2">{fmtDate(m.sentAt)}</span>
                      {m.readAt ? <span className="text-blue-400 text-[10px] ml-1">✓ Read</span> : <span className="text-[#555] text-[10px] ml-1">Unread</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={msgInputs[p.email] ?? ""}
                  onChange={(e) => setMsgInputs((x) => ({ ...x, [p.email]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(p.email)}
                  placeholder="Send a message…"
                  className="flex-1 bg-[#0d0d0d] border border-[#333] rounded-lg px-2 py-1.5 text-white text-xs placeholder-[#444] focus:outline-none focus:border-[#E8A838]"
                />
                <button
                  onClick={() => sendMessage(p.email)}
                  disabled={msgSending === p.email || !msgInputs[p.email]?.trim()}
                  className="text-xs px-3 py-1.5 bg-[#E8A838] text-black rounded-lg font-medium transition disabled:opacity-50"
                >
                  {msgSending === p.email ? "…" : "Send"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Settings */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-4">
        <p className="text-white text-sm font-semibold mb-4">Agent Subscription</p>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[#555] text-xs">Monthly price</span>
          <div className="flex items-center gap-2">
            <span className="text-[#555] text-sm">₹</span>
            <input
              type="number" min={1} max={100000}
              value={subPrice}
              onChange={(e) => setSubPrice(Number(e.target.value))}
              className="w-24 bg-[#0d0d0d] border border-[#333] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#E8A838] transition"
            />
            <button
              onClick={saveSubPrice}
              disabled={priceLoading}
              className="text-xs px-2 py-1.5 bg-[#E8A838] text-black rounded-lg font-medium hover:bg-[#d4962e] transition disabled:opacity-50"
            >
              {priceLoading ? "…" : priceSaved ? "✓" : "Save"}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <p className="text-[#555] text-xs mb-0.5">Razorpay Plan</p>
            {planId ? (
              <p className="text-green-400 text-xs font-mono">{planId}</p>
            ) : (
              <p className="text-[#444] text-xs">No plan created yet</p>
            )}
          </div>
          <button
            onClick={createPlan}
            disabled={planLoading}
            className="text-xs px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50"
          >
            {planLoading ? "Creating…" : planId ? "Recreate Plan" : "Setup Autopay Plan"}
          </button>
        </div>
        {planError && <p className="text-red-400 text-xs mt-2">{planError}</p>}
        {!planId && <p className="text-[#333] text-xs mt-2">Switch to Live mode first. Creates a recurring ₹{subPrice}/mo Razorpay plan for agent subscriptions.</p>}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs text-amber-400 uppercase tracking-widest mb-3">Pending Applications ({pending.length})</p>
          <div className="space-y-2">{pending.map((a) => <AgentCard key={a.profile.email} a={a} />)}</div>
        </div>
      )}

      {/* Active leaderboard */}
      <div>
        <p className="text-xs text-[#444] uppercase tracking-widest mb-3">Active Agents — Leaderboard ({active.length})</p>
        {active.length === 0 ? (
          <p className="text-[#444] text-sm text-center py-8">No active agents yet.</p>
        ) : (
          <div className="space-y-2">
            {active.map((a, i) => (
              <div key={a.profile.email}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#333] text-xs font-bold">#{i + 1}</span>
                </div>
                <AgentCard a={a} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banned */}
      {banned.length > 0 && (
        <div>
          <p className="text-xs text-red-500 uppercase tracking-widest mb-3">Banned Agents ({banned.length})</p>
          <div className="space-y-2">{banned.map((a) => <AgentCard key={a.profile.email} a={a} />)}</div>
        </div>
      )}
    </div>
  );
}

// ── Admin Coupons Tab ─────────────────────────────────────────────────────────

function CouponsTab({ initialCoupons }: { initialCoupons: AdminCoupon[] }) {
  const [coupons, setCoupons] = useState<AdminCoupon[]>(initialCoupons);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discount, setDiscount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiryDays, setExpiryDays] = useState("");
  const [forAgent, setForAgent] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const refreshCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons", { credentials: "include" });
      const d = await res.json() as { coupons?: AdminCoupon[] };
      if (d.coupons) setCoupons(d.coupons);
    } catch {}
  };

  const handleCreate = async () => {
    setCreateError("");
    setCreateSuccess("");
    const cleanCode = code.trim().toUpperCase();
    const discountNum = parseInt(discount);
    if (!cleanCode || !name.trim() || !discount) {
      setCreateError("Code, name, and discount are required.");
      return;
    }
    if (isNaN(discountNum) || discountNum < 1 || discountNum > 99) {
      setCreateError("Discount must be 1–99.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: cleanCode,
          name: name.trim(),
          discount: discountNum,
          maxUses: maxUses ? parseInt(maxUses) : null,
          expiresAt: expiryDays ? Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000 : null,
          forAgent: forAgent.trim().toLowerCase() || undefined,
        }),
      });
      const d = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) {
        setCreateError(d.error ?? "Failed to create.");
      } else {
        setCreateSuccess(`Created ${cleanCode}!`);
        setCode(""); setName(""); setDiscount(""); setMaxUses(""); setExpiryDays(""); setForAgent("");
        await refreshCoupons();
        setTimeout(() => setCreateSuccess(""), 3000);
      }
    } catch { setCreateError("Network error."); }
    setCreating(false);
  };

  const handleRevoke = async (c: string) => {
    setRevoking(c);
    try {
      await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: c, action: "revoke" }),
      });
      setCoupons((prev) => prev.map((cp) => cp.code === c ? { ...cp, revokedAt: Date.now() } : cp));
    } catch {}
    setRevoking(null);
    setConfirmRevoke(null);
  };

  function getCouponStatus(c: AdminCoupon): { label: string; cls: string } {
    if (c.revokedAt) return { label: "Revoked", cls: "text-red-400 border-red-900" };
    if (c.expiresAt && Date.now() > c.expiresAt) return { label: "Expired", cls: "text-[#555] border-[#333]" };
    if (c.maxUses !== null && c.usedCount >= c.maxUses) return { label: "Limit Reached", cls: "text-amber-400 border-amber-900" };
    return { label: "Active", cls: "text-green-400 border-green-900" };
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="bg-[#111] border border-[#E8A838]/20 rounded-xl p-5">
        <p className="text-white text-sm font-semibold mb-4">Create Coupon</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[#555] text-xs mb-1 block">Code *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. TECHTALK20"
              className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] font-mono transition"
            />
          </div>
          <div>
            <label className="text-[#555] text-xs mb-1 block">Name / Label *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TechTalk March Influencer"
              className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
            />
          </div>
          <div>
            <label className="text-[#555] text-xs mb-1 block">Discount % * (1–99)</label>
            <input
              type="number" min={1} max={99}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="e.g. 20"
              className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
            />
          </div>
          <div>
            <label className="text-[#555] text-xs mb-1 block">Max Uses (blank = unlimited)</label>
            <input
              type="number" min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="e.g. 100"
              className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
            />
          </div>
          <div>
            <label className="text-[#555] text-xs mb-1 block">Expires in Days (blank = never)</label>
            <input
              type="number" min={1}
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              placeholder="e.g. 30"
              className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[#555] text-xs mb-1 block">Assign to Agent (email, optional)</label>
            <input
              value={forAgent}
              onChange={(e) => setForAgent(e.target.value)}
              placeholder="agent@email.com — agent sees this in their dashboard"
              className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
            />
          </div>
        </div>
        {createError && <p className="text-red-400 text-xs mb-2">{createError}</p>}
        {createSuccess && <p className="text-green-400 text-xs mb-2">{createSuccess}</p>}
        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-4 py-2 bg-[#E8A838] hover:bg-[#d4962e] text-black text-sm font-semibold rounded-lg transition disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create Coupon"}
        </button>
      </div>

      {/* Coupon list */}
      <div>
        <p className="text-xs text-[#444] uppercase tracking-widest mb-3">
          All Admin Coupons ({coupons.length})
        </p>
        {coupons.length === 0 ? (
          <p className="text-[#444] text-sm text-center py-8">No coupons yet. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {coupons.map((c) => {
              const { label, cls } = getCouponStatus(c);
              const isActive = label === "Active";
              return (
                <div key={c.code} className={`bg-[#111] border rounded-xl p-4 ${isActive ? "border-[#222]" : "border-[#1a1a1a] opacity-60"}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[#E8A838] font-bold text-sm">{c.code}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
                        <span className="text-[10px] text-white bg-[#1a1a1a] px-2 py-0.5 rounded-full">{c.discount}% OFF</span>
                      </div>
                      <p className="text-[#666] text-xs mt-0.5">{c.name}</p>
                      {c.forAgent && <p className="text-blue-400 text-[10px] mt-0.5">Agent: {c.forAgent}</p>}
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="text-xs text-[#555]">
                          Used: <span className="text-white font-medium">{c.usedCount}</span>
                          {c.maxUses !== null ? ` / ${c.maxUses}` : " / ∞"}
                        </span>
                        {c.expiresAt && (
                          <span className="text-xs text-[#555]">
                            {Date.now() > c.expiresAt ? "Expired" : "Expires"}: {fmtDate(c.expiresAt)}
                          </span>
                        )}
                        <span className="text-xs text-[#444]">Created {fmtDate(c.createdAt)}</span>
                        {c.revokedAt && <span className="text-xs text-red-500">Revoked {fmtDate(c.revokedAt)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {c.usedBy.length > 0 && (
                        <button
                          onClick={() => setExpanded((p) => ({ ...p, [c.code]: !p[c.code] }))}
                          className="text-xs text-[#555] hover:text-white transition"
                        >
                          {expanded[c.code] ? "Hide" : `Usage (${c.usedBy.length})`}
                        </button>
                      )}
                      {!c.revokedAt && (
                        confirmRevoke === c.code ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRevoke(c.code)}
                              disabled={revoking === c.code}
                              className="text-xs text-red-400 hover:text-red-300 transition"
                            >
                              {revoking === c.code ? "…" : "Confirm"}
                            </button>
                            <button onClick={() => setConfirmRevoke(null)} className="text-xs text-[#555]">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRevoke(c.code)}
                            className="text-xs text-[#444] hover:text-red-400 transition"
                          >
                            Revoke
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  {expanded[c.code] && c.usedBy.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
                      <p className="text-[#444] text-xs mb-2">Usage History</p>
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {[...c.usedBy].reverse().map((u, i) => (
                          <div key={i} className="flex items-center justify-between text-xs gap-2">
                            <span className="text-[#888] truncate">{u.email}</span>
                            <div className="flex items-center gap-2 text-[#555] shrink-0">
                              {u.tool && <span className="text-[10px] bg-[#1a1a1a] px-1.5 py-0.5 rounded capitalize">{u.tool}</span>}
                              <span>{fmtDate(u.usedAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Blog CMS Tab ──────────────────────────────────────────────────────────────

type BlogPostBasic = { slug: string; title: string; summary: string; content: string; publishedAt: number; updatedAt: number; views: number; tags: string[]; seoTitle?: string; seoDescription?: string };

function BlogTab({ initialPosts }: { initialPosts: BlogPostBasic[] }) {
  const [posts, setPosts] = useState<BlogPostBasic[]>(initialPosts);
  const [creating, setCreating] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", summary: "", content: "", tags: "", seoTitle: "", seoDescription: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => {
    setForm({ title: "", slug: "", summary: "", content: "", tags: "", seoTitle: "", seoDescription: "" });
    setCreating(true);
    setEditingSlug(null);
  };

  const openEdit = (p: BlogPostBasic) => {
    setForm({ title: p.title, slug: p.slug, summary: p.summary, content: p.content, tags: p.tags.join(", "), seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "" });
    setEditingSlug(p.slug);
    setCreating(false);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) { setError("Title and content required"); return; }
    setSaving(true); setError("");
    try {
      const slug = form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
      const body = { ...form, slug, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) };
      const res = await fetch("/api/admin/blog", {
        method: editingSlug ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(editingSlug ? { ...body, slug: editingSlug } : body),
      });
      const d = await res.json() as { post?: BlogPostBasic; error?: string };
      if (!res.ok) { setError(d.error ?? "Failed"); return; }
      if (editingSlug) {
        setPosts((prev) => prev.map((p) => p.slug === editingSlug ? d.post! : p));
      } else {
        setPosts((prev) => [d.post!, ...prev]);
      }
      setCreating(false); setEditingSlug(null);
    } catch { setError("Network error"); }
    setSaving(false);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch("/api/admin/blog", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ slug }) });
    setPosts((prev) => prev.filter((p) => p.slug !== slug));
  };

  const formOpen = creating || !!editingSlug;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-white text-sm font-semibold">Insights Blog ({posts.length} posts)</h2>
        <div className="flex gap-2">
          <a href="/insights" target="_blank" className="text-xs px-3 py-1.5 border border-[#333] text-[#888] hover:text-white rounded-lg transition">View Blog</a>
          {!formOpen && (
            <button onClick={openCreate} className="text-xs px-3 py-1.5 bg-[#E8A838] text-black font-semibold rounded-lg hover:bg-[#d4962e] transition">+ New Post</button>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="bg-[#111] border border-[#E8A838]/20 rounded-xl p-5 space-y-3">
          <h3 className="text-white text-sm font-semibold">{editingSlug ? "Edit Post" : "New Post"}</h3>
          {[
            { label: "Title *", key: "title", placeholder: "How to validate your startup in 7 days" },
            { label: "Slug (auto-generated if blank)", key: "slug", placeholder: "validate-startup-7-days" },
            { label: "Summary", key: "summary", placeholder: "One-liner description for listing page" },
            { label: "Tags (comma-separated)", key: "tags", placeholder: "founder, validation, mvp" },
            { label: "SEO Title", key: "seoTitle", placeholder: "Override for search engines" },
            { label: "SEO Description", key: "seoDescription", placeholder: "160-char description for Google" },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-[#555] text-xs mb-1 block">{f.label}</label>
              <input
                value={form[f.key as keyof typeof form]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
              />
            </div>
          ))}
          <div>
            <label className="text-[#555] text-xs mb-1 block">Content * (markdown supported)</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              rows={12}
              placeholder="## Introduction&#10;&#10;Write your post here in markdown..."
              className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition resize-y font-mono"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="text-xs px-4 py-2 bg-[#E8A838] text-black font-semibold rounded-lg transition disabled:opacity-50">{saving ? "Saving…" : "Save Post"}</button>
            <button onClick={() => { setCreating(false); setEditingSlug(null); }} className="text-xs px-4 py-2 border border-[#333] text-[#888] rounded-lg hover:text-white transition">Cancel</button>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-[#444] text-sm text-center py-8">No posts yet. Write your first Insight above.</p>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.slug} className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{p.title}</p>
                <p className="text-[#555] text-xs mt-0.5">{p.summary.slice(0, 100)}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#444]">
                  <span>{fmtDate(p.publishedAt)}</span>
                  <span>{p.views} views</span>
                  <span className="font-mono text-[#333]">/insights/{p.slug}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/insights/${p.slug}`} target="_blank" className="text-xs text-[#444] hover:text-white transition">View</a>
                <button onClick={() => openEdit(p)} className="text-xs text-[#444] hover:text-[#E8A838] transition">Edit</button>
                <button onClick={() => handleDelete(p.slug)} className="text-xs text-[#444] hover:text-red-400 transition">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Content Bank Tab ──────────────────────────────────────────────────────────

type ContentItemBasic = { id: string; type: "tip" | "idea"; body: string; tags: string[]; addedAt: number };

function ContentTab({ initialItems }: { initialItems: ContentItemBasic[] }) {
  const [items, setItems] = useState<ContentItemBasic[]>(initialItems);
  const [filter, setFilter] = useState<"all" | "tip" | "idea">("all");
  const [newBody, setNewBody] = useState("");
  const [newType, setNewType] = useState<"tip" | "idea">("tip");
  const [newTags, setNewTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  const tips = items.filter((i) => i.type === "tip").length;
  const ideas = items.filter((i) => i.type === "idea").length;

  const handleAdd = async () => {
    if (!newBody.trim()) { setError("Content body required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ type: newType, body: newBody.trim(), tags: newTags.split(",").map((t) => t.trim()).filter(Boolean) }),
      });
      const d = await res.json() as { item?: ContentItemBasic; error?: string };
      if (!res.ok) { setError(d.error ?? "Failed"); return; }
      setItems((prev) => [d.item!, ...prev]);
      setNewBody(""); setNewTags("");
    } catch { setError("Network error"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/admin/content", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id }) });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ seed: true }) });
      const res = await fetch("/api/admin/content", { credentials: "include" });
      const d = await res.json() as { items?: ContentItemBasic[] };
      if (d.items) setItems(d.items);
    } catch {}
    setSeeding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-white text-sm font-semibold">Content Bank</h2>
          <p className="text-[#444] text-xs mt-0.5">{tips} tips · {ideas} ideas · {items.length} total</p>
        </div>
        {items.length === 0 && (
          <button onClick={handleSeed} disabled={seeding} className="text-xs px-3 py-1.5 bg-[#E8A838] text-black font-semibold rounded-lg hover:bg-[#d4962e] transition disabled:opacity-50">
            {seeding ? "Seeding…" : "Seed 20 Tips + 20 Ideas"}
          </button>
        )}
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          {(["tip", "idea"] as const).map((t) => (
            <button key={t} onClick={() => setNewType(t)} className={`text-xs px-3 py-1 rounded-lg border transition ${newType === t ? "border-[#E8A838] text-[#E8A838]" : "border-[#333] text-[#555] hover:text-white"}`}>
              {t === "tip" ? "Startup Tip" : "Zero-Cost Idea"}
            </button>
          ))}
        </div>
        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          rows={3}
          placeholder={newType === "tip" ? "e.g. Talk to 10 customers before writing a line of code." : "e.g. Build a waitlist with a referral mechanism before launch."}
          className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition resize-none"
        />
        <input
          value={newTags}
          onChange={(e) => setNewTags(e.target.value)}
          placeholder="Tags (comma-separated): founder, growth, mvp"
          className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button onClick={handleAdd} disabled={saving} className="text-xs px-4 py-2 bg-[#E8A838] text-black font-semibold rounded-lg disabled:opacity-50 hover:bg-[#d4962e] transition">
          {saving ? "Adding…" : "Add Item"}
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "tip", "idea"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg border transition ${filter === f ? "border-[#E8A838] text-[#E8A838]" : "border-[#333] text-[#555] hover:text-white"}`}>
            {f === "all" ? `All (${items.length})` : f === "tip" ? `Tips (${tips})` : `Ideas (${ideas})`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((item) => (
          <div key={item.id} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.type === "tip" ? "border-blue-800 text-blue-400" : "border-green-800 text-green-400"}`}>{item.type}</span>
                {item.tags.map((t) => <span key={t} className="text-[10px] text-[#444]">#{t}</span>)}
              </div>
              <p className="text-[#888] text-sm leading-relaxed">{item.body}</p>
            </div>
            <button onClick={() => handleDelete(item.id)} className="text-[#333] hover:text-red-400 text-xs transition flex-shrink-0">✕</button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-[#444] text-sm text-center py-8">No {filter === "all" ? "items" : filter + "s"} yet.</p>}
      </div>
    </div>
  );
}

// ── Bans Tab ──────────────────────────────────────────────────────────────────

type BanRecordBasic = { email: string; reason: string; bannedAt: number; bannedUntil: number | null; active: boolean };

function BansTab({ initialBans }: { initialBans: BanRecordBasic[] }) {
  const [bans, setBans] = useState<BanRecordBasic[]>(initialBans);
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [banning, setBanning] = useState(false);
  const [error, setError] = useState("");

  const handleBan = async () => {
    if (!email.trim() || !reason.trim()) { setError("Email and reason required"); return; }
    setBanning(true); setError("");
    try {
      const res = await fetch("/api/admin/bans", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ email: email.trim(), reason: reason.trim(), durationHours: durationHours ? parseInt(durationHours) : undefined }),
      });
      if (!res.ok) { setError("Failed to ban"); return; }
      const newBan: BanRecordBasic = {
        email: email.toLowerCase().trim(), reason: reason.trim(),
        bannedAt: Date.now(), bannedUntil: durationHours ? Date.now() + parseInt(durationHours) * 3600000 : null, active: true,
      };
      setBans((prev) => [newBan, ...prev]);
      setEmail(""); setReason(""); setDurationHours("");
    } catch { setError("Network error"); }
    setBanning(false);
  };

  const handleUnban = async (em: string) => {
    await fetch("/api/admin/bans", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email: em }) });
    setBans((prev) => prev.map((b) => b.email === em ? { ...b, active: false } : b));
  };

  const activeBans = bans.filter((b) => b.active);
  const inactiveBans = bans.filter((b) => !b.active);

  return (
    <div className="space-y-6">
      <div className="bg-[#111] border border-red-900/30 rounded-xl p-5 space-y-3">
        <h2 className="text-white text-sm font-semibold">Ban a User</h2>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@email.com"
          className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-red-700 transition"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for ban"
          className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-red-700 transition"
        />
        <div>
          <label className="text-[#555] text-xs mb-1 block">Duration in Hours (blank = permanent)</label>
          <input
            type="number" min={1}
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            placeholder="e.g. 24 for 1 day, 168 for 1 week — blank = permanent"
            className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-red-700 transition"
          />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button onClick={handleBan} disabled={banning} className="text-xs px-4 py-2 bg-red-800 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50">
          {banning ? "Banning…" : "Ban User"}
        </button>
      </div>

      {activeBans.length > 0 && (
        <div>
          <p className="text-xs text-[#444] uppercase tracking-widest mb-3">Active Bans ({activeBans.length})</p>
          <div className="space-y-2">
            {activeBans.map((b) => (
              <div key={b.email} className="bg-[#111] border border-red-900/30 rounded-xl p-4 flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-white text-sm font-medium">{b.email}</p>
                  <p className="text-red-400 text-xs mt-0.5">{b.reason}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#444]">
                    <span>Banned {fmtDate(b.bannedAt)}</span>
                    {b.bannedUntil ? <span className="text-amber-400">Until {fmtDate(b.bannedUntil)}</span> : <span>Permanent</span>}
                  </div>
                </div>
                <button onClick={() => handleUnban(b.email)} className="text-xs px-3 py-1.5 border border-green-800 text-green-400 hover:bg-green-900/20 rounded-lg transition">Unban</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactiveBans.length > 0 && (
        <div>
          <p className="text-xs text-[#444] uppercase tracking-widest mb-3">Past Bans ({inactiveBans.length})</p>
          <div className="space-y-2 opacity-50">
            {inactiveBans.map((b) => (
              <div key={b.email + b.bannedAt} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3">
                <p className="text-[#666] text-sm">{b.email}</p>
                <p className="text-[#444] text-xs">{b.reason} · {fmtDate(b.bannedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {bans.length === 0 && <p className="text-[#444] text-sm text-center py-8">No bans yet.</p>}
    </div>
  );
}

// ── Pitch Practice Tab ────────────────────────────────────────────────────────

type PPSessionBasic = { id: string; email: string; founderName: string; startupName: string; oneLiner: string; investorType: string; exchanges: { question: string; answer: string }[]; score: { overall: number; verdict: string; strongestMoment: string; weakestMoment: string; improvements: string[] } | null; payment: { amount: number; isFree: boolean } | null; createdAt: number; completedAt: number | null };

function PitchPracticeTab({ sessions }: { sessions: PPSessionBasic[] }) {
  const [selected, setSelected] = useState<PPSessionBasic | null>(null);

  if (!sessions.length) return <p className="text-[#444] text-sm text-center py-8">No pitch practice sessions yet.</p>;

  const scoreColor = (n: number) => n >= 8 ? "text-green-400" : n >= 6 ? "text-[#E8A838]" : n >= 4 ? "text-orange-400" : "text-red-400";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <p className="text-xs text-[#444] uppercase tracking-widest mb-3">Sessions ({sessions.length})</p>
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s)}
            className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition ${selected?.id === s.id ? "border-[#E8A838] bg-[#1a1a0a]" : "border-[#222] hover:border-[#333]"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#888] truncate">{s.startupName}</span>
              {s.score && <span className={`text-xs font-bold shrink-0 ml-2 ${scoreColor(s.score.overall)}`}>{s.score.overall}/10</span>}
              {!s.score && <span className="text-xs text-[#333] shrink-0 ml-2">ongoing</span>}
            </div>
            <div className="text-[10px] text-[#444] mt-0.5">{s.email} · {fmtDate(s.createdAt)} · {s.payment?.isFree ? "Free" : `₹${((s.payment?.amount ?? 0) / 100).toLocaleString("en-IN")}`}</div>
          </button>
        ))}
      </div>
      <div className="md:col-span-2">
        {!selected ? (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6 text-[#444] text-sm text-center">Select a session to view transcript</div>
        ) : (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 space-y-5 overflow-y-auto max-h-[70vh]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-medium">{selected.startupName}</p>
                <p className="text-[#555] text-xs">{selected.founderName} · {selected.oneLiner}</p>
              </div>
              {selected.score && <span className={`text-3xl font-bold ${scoreColor(selected.score.overall)}`}>{selected.score.overall}/10</span>}
            </div>
            {selected.score && (
              <div className="space-y-2 text-xs">
                <p className="text-[#888]"><span className="text-green-500">Best:</span> {selected.score.strongestMoment}</p>
                <p className="text-[#888]"><span className="text-red-400">Gap:</span> {selected.score.weakestMoment}</p>
                <p className="text-[#666] italic">{selected.score.verdict}</p>
              </div>
            )}
            <div className="space-y-4">
              <p className="text-xs text-[#444] uppercase tracking-widest">Transcript</p>
              {selected.exchanges.map((ex, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs text-[#555]">Q{i + 1}: <span className="text-[#777]">{ex.question}</span></p>
                  <p className="text-xs text-[#444] pl-4">→ <span className="text-[#666]">{ex.answer || "(no answer)"}</span></p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Brainstorm Viewer Tab ─────────────────────────────────────────────────────

type BrainstormDocBasic = { email: string; notes: string; todos: { id: string; text: string; done: boolean; priority: string; createdAt: number }[]; updatedAt: number };

function BrainstormTab({ docs }: { docs: BrainstormDocBasic[] }) {
  const [selected, setSelected] = useState<BrainstormDocBasic | null>(null);

  if (!docs.length) return <p className="text-[#444] text-sm text-center py-8">No brainstorm docs yet.</p>;

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const priorityColor: Record<string, string> = { high: "text-red-400", medium: "text-yellow-400", low: "text-[#555]" };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <p className="text-xs text-[#444] uppercase tracking-widest mb-3">Users ({docs.length})</p>
        {docs.map((d) => (
          <button
            key={d.email}
            onClick={() => setSelected(d)}
            className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition ${selected?.email === d.email ? "border-[#E8A838] text-[#E8A838] bg-[#1a1a0a]" : "border-[#222] text-[#888] hover:border-[#444]"}`}
          >
            <div className="truncate">{d.email}</div>
            <div className="text-[10px] text-[#444] mt-0.5">{fmtDate(d.updatedAt)} · {d.todos.length} todos</div>
          </button>
        ))}
      </div>
      <div className="md:col-span-2">
        {!selected ? (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6 text-[#444] text-sm text-center">Select a user to view their brainstorm</div>
        ) : (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 space-y-5">
            <div>
              <p className="text-xs text-[#444] uppercase tracking-widest mb-2">Notes</p>
              <pre className="text-[#888] text-xs whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">{selected.notes || <span className="text-[#333] italic">empty</span>}</pre>
            </div>
            {selected.todos.length > 0 && (
              <div>
                <p className="text-xs text-[#444] uppercase tracking-widest mb-2">Todos ({selected.todos.filter(t => !t.done).length} open)</p>
                <div className="space-y-1">
                  {[...selected.todos].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).map((t) => (
                    <div key={t.id} className={`flex items-start gap-2 text-xs py-1 ${t.done ? "opacity-40 line-through" : ""}`}>
                      <span className={`shrink-0 font-medium ${priorityColor[t.priority] ?? "text-[#555]"}`}>[{t.priority}]</span>
                      <span className="text-[#888]">{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Community Tab ─────────────────────────────────────────────────────────────

type CommunityJob = { id: string; title: string; company: string; posterEmail: string; type: string; postedAt: number; active: boolean };
type CommunityExpert = { id: string; expertName: string; expertEmail: string; bio: string; expertise: string[]; bookingUrl: string; feePaise: number; active: boolean; addedAt: number };
type CommunityDemo = { id: string; startupName: string; oneLiner: string; founderName: string; email: string; votes: number; month: string; submittedAt: number };
type CommunityProvider = { id: string; name: string; category: string; email: string; bio: string; website?: string; verified: boolean; addedAt: number };
type CommunityCircle = { id: string; name: string; sector: string; stage: string; members: string[]; maxMembers: number; createdAt: number };
type CommunityEvent = { id: string; name: string; organizer: string; deadline: number; url: string; prize?: string; location: string; addedAt: number };

type CommunityData = {
  jobs: CommunityJob[];
  expertSlots: CommunityExpert[];
  demoDayEntries: CommunityDemo[];
  providers: CommunityProvider[];
  circles: CommunityCircle[];
  events: CommunityEvent[];
  month: string;
};

const COMMUNITY_SUBTABS = ["Jobs", "Expert Hours", "Demo Day", "Directory", "Circles", "Events"] as const;
type CommunitySubtab = typeof COMMUNITY_SUBTABS[number];

function fmtDateC(ms: number) {
  return new Date(ms).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function BanBtn({ email }: { email: string }) {
  const [done, setDone] = useState(false);
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  if (done) return <span className="text-[10px] text-red-400">Banned</span>;
  if (open) return (
    <div className="flex items-center gap-1">
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="text-[10px] bg-[#111] border border-[#222] rounded px-2 py-1 text-white w-36 focus:outline-none" />
      <button onClick={async () => {
        if (!reason.trim()) return;
        await fetch("/api/admin/bans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, reason }) });
        setDone(true);
      }} className="text-[10px] text-red-400 hover:text-red-300 border border-red-800/40 px-2 py-1 rounded transition">Ban</button>
      <button onClick={() => setOpen(false)} className="text-[10px] text-[#444] hover:text-white">✕</button>
    </div>
  );
  return <button onClick={() => setOpen(true)} className="text-[10px] text-red-500/60 hover:text-red-400 border border-red-900/30 px-2 py-1 rounded transition">Ban user</button>;
}

function RemoveBtn({ type, id, onRemoved }: { type: string; id: string; onRemoved: () => void }) {
  const [removing, setRemoving] = useState(false);
  return (
    <button onClick={async () => {
      setRemoving(true);
      await fetch("/api/admin/community", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) });
      onRemoved();
    }} disabled={removing} className="text-[10px] text-[#555] hover:text-red-400 border border-[#222] px-2 py-1 rounded transition disabled:opacity-40">
      {removing ? "…" : "Remove"}
    </button>
  );
}

function CommunityTab() {
  const [sub, setSub] = useState<CommunitySubtab>("Jobs");
  const [data, setData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/community")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-[#444] text-sm">Loading community data…</p>;
  if (!data) return <p className="text-red-400 text-sm">Failed to load</p>;

  const remove = (key: keyof CommunityData, id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: (prev[key] as { id: string }[]).filter((x) => x.id !== id) };
    });
  };

  return (
    <div>
      <div className="flex gap-1 mb-5 border-b border-[#1a1a1a] overflow-x-auto">
        {COMMUNITY_SUBTABS.map((t) => (
          <button key={t} onClick={() => setSub(t)}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px shrink-0 transition ${sub === t ? "border-[#E8A838] text-[#E8A838]" : "border-transparent text-[#555] hover:text-white"}`}>
            {t}
            <span className="ml-1 opacity-50">
              {t === "Jobs" ? data.jobs.length : t === "Expert Hours" ? data.expertSlots.length : t === "Demo Day" ? data.demoDayEntries.length : t === "Directory" ? data.providers.length : t === "Circles" ? data.circles.length : data.events.length}
            </span>
          </button>
        ))}
      </div>

      {sub === "Jobs" && (
        data.jobs.length === 0 ? <p className="text-[#444] text-sm">No job listings.</p> :
        <div className="space-y-2">
          {data.jobs.map((j) => (
            <div key={j.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{j.title} <span className="text-[10px] text-[#444]">@ {j.company}</span></p>
                <p className="text-[10px] text-[#555] mt-0.5">{j.posterEmail} · {j.type} · {fmtDateC(j.postedAt)}</p>
                {!j.active && <span className="text-[10px] text-red-400">Removed</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <BanBtn email={j.posterEmail} />
                {j.active && <RemoveBtn type="job" id={j.id} onRemoved={() => remove("jobs", j.id)} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {sub === "Expert Hours" && (
        data.expertSlots.length === 0 ? <p className="text-[#444] text-sm">No expert listings.</p> :
        <div className="space-y-2">
          {data.expertSlots.map((e) => (
            <div key={e.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{e.expertName}</p>
                <p className="text-[10px] text-[#555] mt-0.5">{e.expertEmail} · {fmtDateC(e.addedAt)}</p>
                <p className="text-[10px] text-[#444] mt-0.5 truncate">{e.bio}</p>
                <a href={e.bookingUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#E8A838] hover:underline">{e.bookingUrl}</a>
                {!e.active && <span className="ml-2 text-[10px] text-red-400">Removed</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <BanBtn email={e.expertEmail} />
                {e.active && <RemoveBtn type="expert" id={e.id} onRemoved={() => remove("expertSlots", e.id)} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {sub === "Demo Day" && (
        data.demoDayEntries.length === 0 ? <p className="text-[#444] text-sm">No entries for {data.month}.</p> :
        <div className="space-y-2">
          {data.demoDayEntries.map((d) => (
            <div key={d.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{d.startupName}</p>
                <p className="text-[10px] text-[#555] mt-0.5">{d.email} · {d.votes} votes · {fmtDateC(d.submittedAt)}</p>
                <p className="text-[10px] text-[#444] mt-0.5">{d.oneLiner}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <BanBtn email={d.email} />
                <RemoveBtn type="demo" id={d.id} onRemoved={() => remove("demoDayEntries", d.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {sub === "Directory" && (
        data.providers.length === 0 ? <p className="text-[#444] text-sm">No service providers.</p> :
        <div className="space-y-2">
          {data.providers.map((p) => (
            <div key={p.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white font-medium">{p.name}</p>
                  {p.verified && <span className="text-[9px] text-green-400 border border-green-800/40 px-1.5 py-0.5 rounded-full">Verified</span>}
                </div>
                <p className="text-[10px] text-[#555] mt-0.5">{p.email} · {p.category} · {fmtDateC(p.addedAt)}</p>
                <p className="text-[10px] text-[#444] mt-0.5 truncate">{p.bio}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {!p.verified && (
                  <button onClick={async () => {
                    await fetch("/api/admin/community", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "verify_provider", id: p.id }) });
                    setData((prev) => prev ? { ...prev, providers: prev.providers.map((x) => x.id === p.id ? { ...x, verified: true } : x) } : prev);
                  }} className="text-[10px] text-green-400/70 hover:text-green-300 border border-green-900/30 px-2 py-1 rounded transition">
                    Verify
                  </button>
                )}
                <BanBtn email={p.email} />
                <RemoveBtn type="provider" id={p.id} onRemoved={() => remove("providers", p.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {sub === "Circles" && (
        data.circles.length === 0 ? <p className="text-[#444] text-sm">No circles yet.</p> :
        <div className="space-y-2">
          {data.circles.map((c) => (
            <div key={c.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{c.name}</p>
                <p className="text-[10px] text-[#555] mt-0.5">{c.sector} · {c.stage} · {c.members.length}/{c.maxMembers} members · {fmtDateC(c.createdAt)}</p>
                {c.members.length > 0 && (
                  <p className="text-[10px] text-[#333] mt-1 truncate">Members: {c.members.join(", ")}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <RemoveBtn type="circle" id={c.id} onRemoved={() => remove("circles", c.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {sub === "Events" && (
        data.events.length === 0 ? <p className="text-[#444] text-sm">No events submitted.</p> :
        <div className="space-y-2">
          {data.events.map((e) => (
            <div key={e.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{e.name}</p>
                <p className="text-[10px] text-[#555] mt-0.5">by {e.organizer} · {e.location} · deadline {fmtDateC(e.deadline)}</p>
                {e.prize && <p className="text-[10px] text-[#E8A838] mt-0.5">Prize: {e.prize}</p>}
                <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#444] hover:text-[#E8A838] mt-0.5 block truncate">{e.url}</a>
              </div>
              <RemoveBtn type="event" id={e.id} onRemoved={() => remove("events", e.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Revenue Goal Tab ──────────────────────────────────────────────────────────

function RevenueGoalTab() {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const [goal, setGoal] = useState("");
  const [current, setCurrent] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/admin/revenue-goal?month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        setCurrent(d.goal ?? null);
        setGoal(d.goal ? String(Math.round(d.goal / 100)) : "");
      })
      .catch(() => {});
  }, [month]);

  const save = async () => {
    const parsed = parseFloat(goal);
    if (!goal || isNaN(parsed) || parsed < 0) { setMsg("Enter a valid amount"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/revenue-goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, goal: Math.round(parsed * 100) }),
    });
    setSaving(false);
    setMsg(res.ok ? "Saved!" : "Error saving");
    setTimeout(() => setMsg(""), 2000);
    if (res.ok) setCurrent(Math.round(parsed * 100));
  };

  return (
    <div className="space-y-6 max-w-md">
      <h3 className="text-sm font-medium text-white">Revenue Goal</h3>
      <div className="space-y-4 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
        <div>
          <label className="text-xs text-[#666] block mb-1">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
          />
        </div>
        {current !== null && (
          <p className="text-xs text-[#555]">
            Current goal for {month}: <span className="text-[#E8A838]">₹{(current / 100).toLocaleString("en-IN")}</span>
          </p>
        )}
        <div>
          <label className="text-xs text-[#666] block mb-1">Set goal (₹)</label>
          <input
            type="number"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. 50000"
            className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50 w-full"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-[#E8A838] text-black text-sm font-medium rounded-lg hover:bg-[#f0b84a] transition disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Goal"}
        </button>
        {msg && <p className={`text-xs ${msg === "Saved!" ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
      </div>
    </div>
  );
}

// ── Feature Flags Tab ─────────────────────────────────────────────────────────

const FLAG_LABELS: Record<string, string> = {
  buddy_system: "Buddy System",
  demo_day: "Demo Day",
  job_board: "Job Board",
  service_directory: "Service Directory",
  expert_hours: "Expert Office Hours",
  founder_circles: "Founder Circles",
  pitch_events: "Pitch Events",
  dna_quiz: "DNA Quiz",
  email_enabled: "Transactional Emails (SMTP)",
};

const FLAG_DESCRIPTIONS: Record<string, string> = {
  email_enabled: "Requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM env vars + npm install nodemailer",
};

function FeatureFlagsTab() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/flags")
      .then((r) => r.json())
      .then((d) => { setFlags(d); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const toggle = async (flag: string, current: boolean) => {
    setSaving(flag);
    const res = await fetch("/api/admin/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flag, enabled: !current }),
    });
    if (res.ok) setFlags((f) => ({ ...f, [flag]: !current }));
    setSaving(null);
  };

  if (!loaded) return <p className="text-[#444] text-sm">Loading flags…</p>;

  return (
    <div className="max-w-xl space-y-3">
      <p className="text-[#555] text-xs mb-4">Toggle community features. Disabled features hide from navigation and return 404.</p>
      {Object.entries(FLAG_LABELS).map(([flag, label]) => {
        const enabled = flags[flag] ?? false;
        const desc = FLAG_DESCRIPTIONS[flag];
        return (
          <div key={flag} className="flex items-center justify-between p-4 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl">
            <div>
              <p className="text-white text-sm font-medium">{label}</p>
              <p className="text-[#444] text-xs">{flag}</p>
              {desc && <p className="text-[#333] text-[10px] mt-0.5 max-w-xs">{desc}</p>}
            </div>
            <button
              onClick={() => toggle(flag, enabled)}
              disabled={saving === flag}
              className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-[#E8A838]" : "bg-[#333]"} disabled:opacity-50`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── AI Pricing & Payment Gate Tab ─────────────────────────────────────────────

type ToolPrices = { readiness: number; advisor: number; pitchdeck: number; pitch_practice: number };

const TOOL_LABELS: Record<keyof ToolPrices, string> = {
  readiness: "Readiness Check",
  advisor: "Advisor Report",
  pitchdeck: "Pitch Deck Evaluation",
  pitch_practice: "Pitch Practice",
};

function PriceField({ label, keyName, paise, onSave }: {
  label: string;
  keyName: string;
  paise: number;
  onSave: (key: string, rs: number) => Promise<void>;
}) {
  const [val, setVal] = useState(Math.round(paise / 100));
  const [saving, setSaving] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <span className="text-[#888] text-sm flex-1">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[#555] text-sm">₹</span>
        <input
          type="number"
          min={1}
          max={100000}
          value={val}
          onChange={(e) => setVal(parseInt(e.target.value) || 0)}
          className="w-28 bg-[#111] border border-[#222] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#E8A838]"
        />
        <button
          onClick={async () => { setSaving(true); await onSave(keyName, val); setSaving(false); }}
          disabled={saving}
          className="px-3 py-1.5 bg-[#E8A838] text-black text-xs font-medium rounded-lg hover:bg-[#d4962e] disabled:opacity-50 whitespace-nowrap"
        >
          {saving ? "…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function AIPricingTab() {
  const [aiPrice, setAiPrice] = useState(2999);
  const [gate, setGate] = useState<"open" | "early_access" | "live">("live");
  const [toolPrices, setToolPrices] = useState<ToolPrices>({ readiness: 99900, advisor: 99900, pitchdeck: 99900, pitch_practice: 299900 });
  const [savingAiPrice, setSavingAiPrice] = useState(false);
  const [savingGate, setSavingGate] = useState(false);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/ai-pricing")
      .then((r) => r.json())
      .then((d) => {
        setAiPrice(Math.round(d.price / 100));
        setGate(d.gate);
        if (d.toolPrices) setToolPrices(d.toolPrices);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };

  const saveAiPrice = async () => {
    setSavingAiPrice(true);
    const res = await fetch("/api/admin/ai-pricing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ price: aiPrice }) });
    setSavingAiPrice(false);
    flash(res.ok ? "AI tools price saved" : "Failed to save");
  };

  const saveToolPrice = async (toolKey: string, rs: number) => {
    const res = await fetch("/api/admin/ai-pricing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toolKey, toolPrice: rs }) });
    flash(res.ok ? `${TOOL_LABELS[toolKey as keyof ToolPrices] ?? toolKey} price saved` : "Failed to save");
  };

  const saveGate = async (newGate: typeof gate) => {
    setSavingGate(true);
    const res = await fetch("/api/admin/ai-pricing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gate: newGate }) });
    if (res.ok) setGate(newGate);
    setSavingGate(false);
    flash(res.ok ? "Payment gate updated" : "Failed");
  };

  if (!loaded) return <p className="text-[#444] text-sm">Loading…</p>;

  return (
    <div className="max-w-xl space-y-6">
      {msg && <p className="text-green-400 text-xs">{msg}</p>}

      {/* Per-evaluation pricing */}
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
        <h3 className="text-white text-sm font-medium mb-1">Evaluation Report Prices</h3>
        <p className="text-[#444] text-xs mb-4">Per-report prices charged to users. Changes take effect immediately — no redeploy needed.</p>
        <div className="space-y-3">
          {(Object.keys(TOOL_LABELS) as (keyof ToolPrices)[]).map((key) => (
            <PriceField
              key={key}
              label={TOOL_LABELS[key]}
              keyName={key}
              paise={toolPrices[key]}
              onSave={saveToolPrice}
            />
          ))}
        </div>
      </div>

      {/* AI tools price */}
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
        <h3 className="text-white text-sm font-medium mb-1">AI Tools Price</h3>
        <p className="text-[#444] text-xs mb-4">Price for secondary AI tools (Pivot Advisor, GTM Strategy, One-Pager, etc.) from 2nd use onwards. First use is always free.</p>
        <div className="flex gap-3 items-center">
          <span className="text-[#888] text-sm">₹</span>
          <input
            type="number"
            min={1}
            max={100000}
            value={aiPrice}
            onChange={(e) => setAiPrice(parseInt(e.target.value) || 0)}
            className="w-32 bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E8A838]"
          />
          <button onClick={saveAiPrice} disabled={savingAiPrice} className="px-4 py-2 bg-[#E8A838] text-black text-xs font-medium rounded-lg hover:bg-[#d4962e] disabled:opacity-50">
            {savingAiPrice ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Payment gate */}
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
        <h3 className="text-white text-sm font-medium mb-1">Payment Gate</h3>
        <p className="text-[#444] text-xs mb-4">Controls how payments work across the entire platform.</p>
        <div className="space-y-2">
          {([
            { value: "open", label: "Open", desc: "All tools free for everyone — no payment required" },
            { value: "early_access", label: "Early Access", desc: "Free via admin-issued coupons only — use while Razorpay account is under review" },
            { value: "live", label: "Live", desc: "Full payment via Razorpay — normal production mode" },
          ] as const).map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => saveGate(value)}
              disabled={savingGate}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition ${gate === value ? "border-[#E8A838]/50 bg-[#E8A838]/5" : "border-[#222] hover:border-[#333]"}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${gate === value ? "border-[#E8A838] bg-[#E8A838]" : "border-[#444]"}`} />
              <div>
                <p className={`text-sm font-medium ${gate === value ? "text-[#E8A838]" : "text-white"}`}>{label}</p>
                <p className="text-[#555] text-xs">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Announcement Tab ──────────────────────────────────────────────────────────

function AnnouncementTab() {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "success">("info");
  const [current, setCurrent] = useState<{ message: string; type: string; active: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/announcement")
      .then((r) => r.json())
      .then((d) => { setCurrent(d); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const save = async () => {
    if (!message.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/announcement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: message.trim(), type }) });
    if (res.ok) { setCurrent({ message: message.trim(), type, active: true }); setMsg("Announcement set"); }
    else setMsg("Failed to set");
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  };

  const clear = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/announcement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clear: true }) });
    if (res.ok) { setCurrent(null); setMsg("Cleared"); }
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  };

  if (!loaded) return <p className="text-[#444] text-sm">Loading…</p>;

  return (
    <div className="max-w-xl space-y-5">
      {msg && <p className="text-green-400 text-xs">{msg}</p>}

      {current && (
        <div className={`p-4 rounded-xl border ${current.type === "warning" ? "bg-yellow-900/20 border-yellow-800/30 text-yellow-400" : current.type === "success" ? "bg-green-900/20 border-green-800/30 text-green-400" : "bg-blue-900/20 border-blue-800/30 text-blue-400"}`}>
          <p className="text-xs uppercase tracking-wider mb-1">Current Announcement</p>
          <p className="text-white text-sm">{current.message}</p>
          <button onClick={clear} disabled={saving} className="mt-2 text-xs text-[#555] hover:text-red-400 transition">Clear announcement</button>
        </div>
      )}

      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
        <h3 className="text-white text-sm font-medium mb-4">Set new announcement</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-[#444] block mb-1">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="e.g. We're undergoing maintenance from 2–4 AM IST tonight." className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition resize-none" />
          </div>
          <div>
            <label className="text-[10px] text-[#444] block mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-2 text-white text-sm focus:outline-none">
              <option value="info">Info (blue)</option>
              <option value="warning">Warning (yellow)</option>
              <option value="success">Success (green)</option>
            </select>
          </div>
          <button onClick={save} disabled={saving || !message.trim()} className="w-full py-2 bg-[#E8A838] text-black text-xs font-medium rounded-lg disabled:opacity-50">
            {saving ? "Saving…" : "Set Announcement"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NPS Tab ───────────────────────────────────────────────────────────────────

type NPSEntry = { score: number; tool: string; comment?: string; email?: string; submittedAt: number };

function NPSTab() {
  const [entries, setEntries] = useState<NPSEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/nps").then((r) => r.json()).then((d) => { setEntries(Array.isArray(d) ? d : []); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  if (!loaded) return <p className="text-[#444] text-sm">Loading…</p>;

  const avg = entries.length ? (entries.reduce((s, e) => s + e.score, 0) / entries.length).toFixed(1) : "—";
  const promoters = entries.filter((e) => e.score >= 9).length;
  const detractors = entries.filter((e) => e.score <= 6).length;
  const nps = entries.length ? Math.round(((promoters - detractors) / entries.length) * 100) : null;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Responses", value: entries.length },
          { label: "Avg score", value: avg },
          { label: "NPS score", value: nps !== null ? nps : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-[#555] text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="text-[#444] text-sm text-center py-12">No NPS submissions yet.</p>
      ) : (
        <div className="space-y-2">
          {[...entries].sort((a, b) => b.submittedAt - a.submittedAt).map((e, i) => (
            <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-lg font-bold ${e.score >= 9 ? "text-green-400" : e.score >= 7 ? "text-yellow-400" : "text-red-400"}`}>{e.score}</span>
                    <span className="text-[#444] text-xs">{e.tool}</span>
                    {e.email && <span className="text-[#333] text-xs">{e.email}</span>}
                  </div>
                  {e.comment && <p className="text-[#888] text-xs">{e.comment}</p>}
                </div>
                <span className="text-[#333] text-xs shrink-0">{fmtDate(e.submittedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Feedback Tab ──────────────────────────────────────────────────────────────

type FeedbackEntry = { id: string; type: "bug" | "feature" | "other"; body: string; page: string; email?: string; submittedAt: number; resolved: boolean };

function FeedbackTab() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | "bug" | "feature" | "other">("all");

  useEffect(() => {
    fetch("/api/feedback").then((r) => r.json()).then((d) => { setEntries(Array.isArray(d) ? d : []); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const resolve = async (id: string) => {
    await fetch("/api/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, resolved: true } : e));
  };

  if (!loaded) return <p className="text-[#444] text-sm">Loading…</p>;

  const filtered = filter === "all" ? entries : entries.filter((e) => e.type === filter);
  const open = entries.filter((e) => !e.resolved).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="text-[#555] text-xs">{open} open · {entries.length} total</span>
        <div className="flex gap-1">
          {(["all", "bug", "feature", "other"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-xs rounded-lg transition ${filter === f ? "bg-[#E8A838] text-black" : "bg-[#111] text-[#555] hover:text-white"}`}>{f}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[#444] text-sm text-center py-12">No feedback in this category.</p>
      ) : (
        <div className="space-y-2">
          {[...filtered].sort((a, b) => b.submittedAt - a.submittedAt).map((e) => (
            <div key={e.id} className={`bg-[#0d0d0d] border rounded-xl p-4 ${e.resolved ? "opacity-40 border-[#111]" : "border-[#1a1a1a]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[9px] px-2 py-0.5 rounded border ${e.type === "bug" ? "text-red-400 border-red-800/40" : e.type === "feature" ? "text-blue-400 border-blue-800/40" : "text-[#555] border-[#333]"}`}>{e.type}</span>
                    <span className="text-[#333] text-xs">{e.page}</span>
                    {e.email && <span className="text-[#333] text-xs">{e.email}</span>}
                    <span className="text-[#333] text-xs">{fmtDate(e.submittedAt)}</span>
                  </div>
                  <p className="text-[#888] text-sm">{e.body}</p>
                </div>
                {!e.resolved && (
                  <button onClick={() => resolve(e.id)} className="text-[10px] text-[#444] hover:text-green-400 transition shrink-0">Resolve</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Audit Log Tab ─────────────────────────────────────────────────────────────

type AuditEntry = { id: string; adminEmail: string; action: string; details: string; timestamp: number };

function AuditTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/audit").then((r) => r.json()).then((d) => { setEntries(Array.isArray(d) ? d : []); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  if (!loaded) return <p className="text-[#444] text-sm">Loading…</p>;

  return (
    <div>
      {entries.length === 0 ? (
        <p className="text-[#444] text-sm text-center py-12">No audit entries yet.</p>
      ) : (
        <div className="space-y-1">
          {entries.map((e) => (
            <div key={e.id} className="flex gap-4 p-3 bg-[#0d0d0d] border border-[#111] rounded-xl text-xs">
              <span className="text-[#333] shrink-0 w-24">{fmtDate(e.timestamp)} {fmtTime(e.timestamp)}</span>
              <span className="text-[#E8A838] shrink-0">{e.action}</span>
              <span className="text-[#888] flex-1 min-w-0 truncate">{e.details}</span>
              <span className="text-[#333] shrink-0">{e.adminEmail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard Client ─────────────────────────────────────────────────────

type EnrichedSession = Session & { report: Report | null };
const TABS = ["Overview", "Readiness Check", "Advisor", "Pitch Deck", "Coupons", "Agents", "Blog", "Content", "Bans", "Community", "Brainstorm", "Pitch Practice", "Flags", "AI Pricing", "Revenue Goal", "Announcement", "NPS", "Feedback", "Audit"] as const;
type Tab = typeof TABS[number];

export default function AdminDashboardClient({
  readinessSessions,
  advisorSessions,
  pitchDeckSessions,
  analytics,
  days,
  dayCounts,
  adminCoupons,
  agentData,
  agentSubPrice,
  agentPlanId,
  blogPosts,
  contentItems,
  allBans,
  brainstormDocs,
  pitchPracticeSessions,
}: {
  readinessSessions: EnrichedSession[];
  advisorSessions: AdvisorSession[];
  pitchDeckSessions: PitchDeckSession[];
  analytics: DashboardAnalytics;
  days: string[];
  dayCounts: number[];
  adminCoupons: AdminCoupon[];
  agentData: AgentDashData[];
  agentSubPrice: number;
  agentPlanId: string | null;
  blogPosts: BlogPostBasic[];
  contentItems: ContentItemBasic[];
  allBans: BanRecordBasic[];
  brainstormDocs: BrainstormDocBasic[];
  pitchPracticeSessions: PPSessionBasic[];
}) {
  const [tab, setTab] = useState<Tab>("Overview");

  const tabCount: Partial<Record<Tab, number>> = {
    "Readiness Check": readinessSessions.length,
    "Advisor": advisorSessions.length,
    "Pitch Deck": pitchDeckSessions.length,
    "Coupons": adminCoupons.length,
    "Agents": agentData.length,
    "Blog": blogPosts.length,
    "Content": contentItems.length,
    "Bans": allBans.filter((b) => b.active).length,
    "Brainstorm": brainstormDocs.length,
    "Pitch Practice": pitchPracticeSessions.length,
  };

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
            {tabCount[t] !== undefined && (
              <span className="ml-1.5 text-xs opacity-60">{tabCount[t]}</span>
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
      {tab === "Coupons" && <CouponsTab initialCoupons={adminCoupons} />}
      {tab === "Agents" && <AgentsTab initialData={agentData} initialSubPrice={agentSubPrice} initialPlanId={agentPlanId} />}
      {tab === "Blog" && <BlogTab initialPosts={blogPosts} />}
      {tab === "Content" && <ContentTab initialItems={contentItems} />}
      {tab === "Bans" && <BansTab initialBans={allBans} />}
      {tab === "Brainstorm" && <BrainstormTab docs={brainstormDocs} />}
      {tab === "Pitch Practice" && <PitchPracticeTab sessions={pitchPracticeSessions} />}
      {tab === "Community" && <CommunityTab />}
      {tab === "Flags" && <FeatureFlagsTab />}
      {tab === "AI Pricing" && <AIPricingTab />}
      {tab === "Revenue Goal" && <RevenueGoalTab />}
      {tab === "Announcement" && <AnnouncementTab />}
      {tab === "NPS" && <NPSTab />}
      {tab === "Feedback" && <FeedbackTab />}
      {tab === "Audit" && <AuditTab />}
    </div>
  );
}
