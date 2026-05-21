"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { UserProfile, DynamicCoupon, Session, Report, AdvisorSession, PitchDeckSession } from "@/lib/db";

type Reports = {
  readiness: (Session & { report: Report | null })[];
  advisor: AdvisorSession[];
  pitchDeck: PitchDeckSession[];
};

type Props = {
  user: UserProfile;
  coupons: DynamicCoupon[];
  referralStats: { total: number; converted: number };
  reports: Reports;
  siteUrl: string;
};

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtExpiry(ms: number) {
  const days = Math.ceil((ms - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Expired";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} days`;
}

const VERDICT_STYLE: Record<string, string> = {
  READY: "text-green-400",
  "CONDITIONALLY READY": "text-amber-400",
  "NOT READY": "text-red-400",
};

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#1a1a1a] border border-[#333] text-[#888] hover:text-white hover:border-[#555] rounded-lg transition"
    >
      {copied ? "✓ Copied" : (label ?? "Copy")}
    </button>
  );
}

export default function UserDashboard({ user, coupons, referralStats, reports, siteUrl }: Props) {
  const referralLink = `${siteUrl}?ref=${user.referralCode}`;
  const totalReports = reports.readiness.length + reports.advisor.length + reports.pitchDeck.length;
  const activeCoupons = coupons.filter((c) => !c.usedAt && Date.now() < c.expiresAt);

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-16">
      {/* Header */}
      <div className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="text-[#555] hover:text-white text-sm transition">← Home</Link>
          <div className="flex items-center gap-3">
            {user.picture ? (
              <Image src={user.picture} alt={user.name} width={32} height={32} className="rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#E8A838] flex items-center justify-center text-black text-sm font-bold">
                {user.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-white text-sm font-medium">{user.name}</p>
              <p className="text-[#555] text-xs">{user.email}</p>
            </div>
          </div>
          <a
            href="/api/auth/signout"
            className="text-xs text-[#555] hover:text-white transition"
          >
            Sign out
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalReports}</div>
            <div className="text-xs text-[#555] mt-1">Reports</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{activeCoupons.length}</div>
            <div className="text-xs text-[#555] mt-1">Active Coupons</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#E8A838]">{referralStats.total}</div>
            <div className="text-xs text-[#555] mt-1">Referrals</div>
          </div>
        </div>

        {/* Coupons */}
        {coupons.length > 0 && (
          <div>
            <h2 className="text-xs text-[#444] uppercase tracking-widest mb-3">Your Coupons</h2>
            <div className="space-y-2">
              {coupons.map((c) => {
                const used = !!c.usedAt;
                const expired = !used && Date.now() > c.expiresAt;
                const active = !used && !expired;
                return (
                  <div key={c.code} className={`bg-[#111] border rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap ${active ? "border-green-800/30" : "border-[#1a1a1a] opacity-50"}`}>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-lg font-bold text-white tracking-wide">{c.code}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${used ? "border-[#333] text-[#444]" : expired ? "border-red-900 text-red-500" : "border-green-800 text-green-400 bg-green-900/10"}`}>
                          {used ? "Used" : expired ? "Expired" : `${c.discount}% OFF · Active`}
                        </span>
                      </div>
                      <p className="text-xs text-[#555] mt-1">
                        {c.reason === "referral_joiner" ? "Welcome gift — joined via referral" : "Earned — your referral made a purchase"}
                        {active && ` · ${fmtExpiry(c.expiresAt)}`}
                        {used && ` · Used ${fmtDate(c.usedAt!)}`}
                      </p>
                    </div>
                    {active && <CopyButton text={c.code} label="Copy Code" />}
                  </div>
                );
              })}
            </div>
            {activeCoupons.length > 0 && (
              <p className="text-xs text-[#444] mt-3">Apply at checkout when paying for any Devbridge tool. One-time use — works across all tools.</p>
            )}
          </div>
        )}

        {/* Referral */}
        <div className="bg-[#111] border border-[#E8A838]/20 rounded-xl p-5">
          <h2 className="text-white text-sm font-semibold mb-1">Refer a Founder</h2>
          <p className="text-[#666] text-xs mb-4 leading-relaxed">
            Share your link. When someone signs up using it, they get a <span className="text-white">5% welcome coupon</span> instantly.
            When they make their first purchase, you earn a <span className="text-white">5% coupon</span> too.
            Each coupon is one-time use, valid 90 days, works on any Devbridge tool.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="flex-1 min-w-0 text-xs text-[#888] bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 truncate font-mono">
              {referralLink}
            </code>
            <CopyButton text={referralLink} label="Copy Link" />
          </div>
          {referralStats.total > 0 && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-[#1a1a1a]">
              <div>
                <div className="text-white font-bold">{referralStats.total}</div>
                <div className="text-[10px] text-[#555]">Signed up</div>
              </div>
              <div>
                <div className="text-[#E8A838] font-bold">{referralStats.converted}</div>
                <div className="text-[10px] text-[#555]">Purchased · coupon earned</div>
              </div>
            </div>
          )}
        </div>

        {/* Reports */}
        {totalReports === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#444] text-sm mb-4">No reports yet. Try one of the tools below.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/" className="text-xs px-4 py-2 border border-[#333] text-[#888] rounded-lg hover:text-white hover:border-[#555] transition">Readiness Check</Link>
              <Link href="/advisor" className="text-xs px-4 py-2 border border-[#333] text-[#888] rounded-lg hover:text-white hover:border-[#555] transition">Advisor Report</Link>
              <Link href="/pitch-deck" className="text-xs px-4 py-2 border border-[#333] text-[#888] rounded-lg hover:text-white hover:border-[#555] transition">Pitch Deck</Link>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xs text-[#444] uppercase tracking-widest mb-3">Your Reports</h2>
            <div className="space-y-2">
              {reports.readiness.map((s) => (
                <Link key={s.id} href={`/report/${s.id}`} className="block bg-[#111] border border-[#222] hover:border-[#333] rounded-xl p-4 transition">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-white text-sm font-medium">{s.startupIdea?.slice(0, 60)}{(s.startupIdea?.length ?? 0) > 60 ? "…" : ""}</p>
                      <p className="text-[#555] text-xs mt-0.5">Readiness Check · {fmtDate(s.createdAt)}</p>
                    </div>
                    {s.report && (
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-semibold ${VERDICT_STYLE[s.report.verdict] ?? "text-white"}`}>{s.report.verdict}</p>
                        <p className="text-[#555] text-xs">{s.report.realityScore}/100</p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              {reports.advisor.map((s) => (
                <Link key={s.id} href={`/advisor/report/${s.id}`} className="block bg-[#111] border border-[#222] hover:border-[#333] rounded-xl p-4 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white text-sm font-medium">{s.founderName}</p>
                      <p className="text-[#555] text-xs mt-0.5">Advisor Report · {fmtDate(s.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[#E8A838] text-xs font-semibold">{s.pathway}</p>
                      <p className="text-[#555] text-xs">{s.overallScore}/100</p>
                    </div>
                  </div>
                </Link>
              ))}
              {reports.pitchDeck.map((s) => (
                <Link key={s.id} href={`/pitch-deck/report/${s.id}`} className="block bg-[#111] border border-[#222] hover:border-[#333] rounded-xl p-4 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white text-sm font-medium">{s.founderName ?? "Pitch Deck"}</p>
                      <p className="text-[#555] text-xs mt-0.5">Pitch Deck · {fmtDate(s.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-white">{s.overallVerdict?.slice(0, 20)}</p>
                      <p className="text-[#555] text-xs">DB {s.dbScore} / GR {s.grScore}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
