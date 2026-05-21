"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { UserProfile, DynamicCoupon, Session, Report, AdvisorSession, PitchDeckSession, DNAResult, Achievement } from "@/lib/db";
import NewsFeed from "./NewsFeed";
import OnboardingChecklist from "./OnboardingChecklist";
import NextStepPanel from "./NextStepPanel";
import AchievementsPanel from "./AchievementsPanel";

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
  onboardingSteps?: string[];
  dnaResult?: DNAResult | null;
  achievements?: Achievement[];
  sessionCount?: number;
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

type ScoreEntry = { score: number; verdict: string; sessionId: string; recordedAt: number };

function ScoreHistoryGraph({ entries }: { entries: ScoreEntry[] }) {
  if (entries.length < 2) return null;
  const max = 100;
  const w = 280;
  const h = 80;
  const pts = entries.slice(-12).reverse();
  const xStep = w / (pts.length - 1);
  const points = pts.map((e, i) => ({ x: i * xStep, y: h - (e.score / max) * h }));
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const verdictColor = (v: string) => v === "READY" ? "#4ade80" : v === "CONDITIONALLY READY" ? "#E8A838" : "#f87171";
  const latest = pts[pts.length - 1];
  const first = pts[0];
  const delta = latest.score - first.score;

  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[#444] uppercase tracking-widest">Readiness Score History</p>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold" style={{ color: verdictColor(latest.verdict) }}>{latest.score}</span>
          <span className={`text-xs ${delta >= 0 ? "text-green-400" : "text-red-400"}`}>{delta >= 0 ? "+" : ""}{delta} pts</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
        <path d={d} fill="none" stroke="#E8A838" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={verdictColor(pts[i].verdict)} />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-[#333]">{new Date(first.recordedAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}</span>
        <span className="text-[9px] text-[#333]">{new Date(latest.recordedAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}</span>
      </div>
    </div>
  );
}

export default function UserDashboard({ user, coupons, referralStats, reports, siteUrl, onboardingSteps = [], dnaResult, achievements = [], sessionCount = 0 }: Props) {
  const referralLink = `${siteUrl}?ref=${user.referralCode}`;
  const totalReports = reports.readiness.length + reports.advisor.length + reports.pitchDeck.length;
  const activeCoupons = coupons.filter((c) => !c.usedAt && Date.now() < c.expiresAt);
  const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    fetch("/api/score-history")
      .then((r) => r.json())
      .then((d: { history?: ScoreEntry[] }) => { if (d.history) setScoreHistory(d.history); })
      .catch(() => {});
  }, []);

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

        {/* Next Step Recommendations */}
        {totalReports > 0 && (
          <NextStepPanel reports={reports} onboardingSteps={onboardingSteps} />
        )}

        {/* Onboarding Checklist */}
        {onboardingSteps.length < 5 && (
          <OnboardingChecklist completedSteps={onboardingSteps} />
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <AchievementsPanel achievements={achievements} />
        )}

        {/* DNA Result */}
        {dnaResult && (
          <div className="bg-[#0d0d0d] border border-[#E8A838]/20 rounded-xl p-5">
            <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-1">Your Founder DNA</p>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-white text-xl font-bold">{dnaResult.archetype}</h3>
                <p className="text-[#444] text-xs mt-0.5">
                  {dnaResult.archetype === "Visionary" && "You see what others can't — the future. Lead with big ideas."}
                  {dnaResult.archetype === "Executor" && "You get things done. Your strength is shipping fast and iterating."}
                  {dnaResult.archetype === "Networker" && "Relationships are your moat. People open doors for you."}
                  {dnaResult.archetype === "Builder" && "You love making things. Your product instinct is your edge."}
                </p>
              </div>
              <div className="flex gap-3">
                {Object.entries(dnaResult.scores).map(([k, v]) => (
                  <div key={k} className="text-center">
                    <div className="text-sm font-bold text-[#E8A838]">{v}</div>
                    <div className="text-[9px] text-[#444] capitalize">{k}</div>
                  </div>
                ))}
              </div>
            </div>
            <a href="/dna" className="text-xs text-[#444] hover:text-[#666] transition mt-3 inline-block">Retake quiz →</a>
          </div>
        )}

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
                          {used ? "Used" : expired ? "Expired" : c.discount >= 100 ? "Free Evaluation · Active" : `${c.discount}% OFF · Active`}
                        </span>
                      </div>
                      <p className="text-xs text-[#555] mt-1">
                        {c.reason === "referral_joiner" ? "Welcome gift — you joined via a referral link" : "Earned — your referral ran their first evaluation"}
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
          <h2 className="text-white text-sm font-semibold mb-1">Refer a Founder — You Both Get a Free Report</h2>
          <p className="text-[#666] text-xs mb-4 leading-relaxed">
            Share your link. Your friend gets a <span className="text-white">free evaluation</span> when they sign up.
            When they use it, <span className="text-white">you get one too</span> — automatically, no strings.
          </p>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <code className="flex-1 min-w-0 text-xs text-[#888] bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 truncate font-mono">
              {referralLink}
            </code>
            <CopyButton text={referralLink} label="Copy Link" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`I've been stress-testing my startup idea with AI on Devbridge. Use my link and get a free evaluation: ${referralLink}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#0d0d0d] border border-[#333] text-[#888] hover:text-white hover:border-[#555] rounded-lg transition"
            >
              <span className="text-green-400">●</span> WhatsApp
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just stress-tested my startup idea with AI — got a brutal, honest reality check. Use my link for a free evaluation: ${referralLink} via @DevbridgeKerala`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#0d0d0d] border border-[#333] text-[#888] hover:text-white hover:border-[#555] rounded-lg transition"
            >
              <span className="text-sky-400">●</span> X / Twitter
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#0d0d0d] border border-[#333] text-[#888] hover:text-white hover:border-[#555] rounded-lg transition"
            >
              <span className="text-blue-400">●</span> LinkedIn
            </a>
          </div>
          {referralStats.total > 0 && (
            <div className="flex gap-6 mt-4 pt-4 border-t border-[#1a1a1a]">
              <div>
                <div className="text-white font-bold">{referralStats.total}</div>
                <div className="text-[10px] text-[#555]">Founders referred</div>
              </div>
              <div>
                <div className="text-[#E8A838] font-bold">{referralStats.converted}</div>
                <div className="text-[10px] text-[#555]">Converted · coupon earned</div>
              </div>
              {referralStats.total > 0 && (
                <div>
                  <div className="text-green-400 font-bold">{Math.round((referralStats.converted / referralStats.total) * 100)}%</div>
                  <div className="text-[10px] text-[#555]">Conversion rate</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Score History */}
        <ScoreHistoryGraph entries={scoreHistory} />

        {/* Quick Links */}
        <div className="mb-2">
          <p className="text-[10px] text-[#333] uppercase tracking-widest mb-2">AI Tools</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
            {[
              { href: "/tools/pivot-advisor", label: "Pivot Advisor", icon: "⟳" },
              { href: "/tools/gtm-strategy", label: "GTM Strategy", icon: "→" },
              { href: "/tools/north-star", label: "North Star", icon: "★" },
              { href: "/tools/one-pager", label: "One-Pager", icon: "◻" },
              { href: "/tools", label: "All Tools", icon: "+" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="bg-[#111] border border-[#222] hover:border-[#E8A838]/30 rounded-xl p-3 text-center transition">
                <div className="text-lg mb-1 text-[#E8A838]">{l.icon}</div>
                <p className="text-[#666] text-[10px] hover:text-white transition">{l.label}</p>
              </Link>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { href: "/brainstorm", label: "Brainstorm", icon: "💡" },
            { href: "/pitch-practice", label: "Pitch Practice", icon: "🎯" },
            { href: "/journal", label: "Weekly Journal", icon: "📝" },
            { href: "/crm", label: "Investor CRM", icon: "📊" },
            { href: "/runway", label: "Runway Calc", icon: "💸" },
            { href: "/match", label: "Find Co-founders", icon: "🤝" },
            { href: "/feed", label: "Founder Feed", icon: "🌐" },
            { href: "/dna", label: "DNA Quiz", icon: "🧬" },
            { href: "/jobs", label: "Job Board", icon: "💼" },
            { href: "/circles", label: "Circles", icon: "◎" },
            { href: "/events", label: "Pitch Events", icon: "🏆" },
            { href: "/okr", label: "OKR Tracker", icon: "🎯" },
            { href: "/insights", label: "Insights Blog", icon: "📖" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="bg-[#111] border border-[#222] hover:border-[#444] rounded-xl p-3 text-center transition"
            >
              <div className="text-xl mb-1">{l.icon}</div>
              <p className="text-[#888] text-xs hover:text-white transition">{l.label}</p>
            </Link>
          ))}
        </div>

        {/* News Feed */}
        <div>
          <h2 className="text-xs text-[#444] uppercase tracking-widest mb-3">Startup News & Grants</h2>
          <NewsFeed />
        </div>

        {/* Stale eval nudge */}
        {(() => {
          const latest = reports.readiness.find((s) => s.report);
          if (!latest) return null;
          const ageMs = Date.now() - latest.createdAt;
          const days = Math.floor(ageMs / (1000 * 60 * 60 * 24));
          if (days < 30) return null;
          const isRed = days >= 60;
          return (
            <div className={`rounded-xl p-4 border flex items-center justify-between gap-3 flex-wrap ${isRed ? "bg-red-900/10 border-red-900/30" : "bg-amber-900/10 border-amber-800/30"}`}>
              <div>
                <p className={`text-xs font-semibold ${isRed ? "text-red-400" : "text-amber-400"}`}>
                  {isRed ? "Evaluation overdue" : "Evaluation getting stale"} · {days} days ago
                </p>
                <p className="text-[#666] text-xs mt-0.5">Your last readiness check was {days} days ago. Re-evaluate to track progress.</p>
              </div>
              <a href="/" className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-semibold transition ${isRed ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-amber-900/30 text-amber-400 hover:bg-amber-900/50"}`}>
                Re-evaluate →
              </a>
            </div>
          );
        })()}

        {/* Reports */}
        {totalReports === 0 ? (
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-white text-base font-semibold mb-2">Run your first reality check</h3>
            <p className="text-[#555] text-xs leading-relaxed mb-6 max-w-xs mx-auto">
              The AI will ask you 40+ hard questions about your idea. No cheerleading. Just a brutally honest score, gaps, and what to do next.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="px-5 py-2.5 bg-[#E8A838] text-black text-sm font-semibold rounded-xl hover:bg-[#d4962e] transition"
              >
                Start Readiness Check
              </Link>
              <Link
                href="/advisor"
                className="px-5 py-2.5 border border-[#333] text-[#888] text-sm rounded-xl hover:text-white hover:border-[#555] transition"
              >
                Advisor Report
              </Link>
            </div>
            {sessionCount > 10 && (
              <p className="text-[#333] text-[10px] mt-5">
                Join {sessionCount.toLocaleString("en-IN")}+ founders who've stress-tested their ideas on Devbridge
              </p>
            )}
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
