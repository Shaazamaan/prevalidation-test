import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — Devbridge",
  description: "New features, improvements, and fixes shipped by the Devbridge team.",
};

const ENTRIES = [
  {
    date: "May 2026",
    version: "2.0",
    tag: "major",
    changes: [
      { type: "new", text: "AI Tools Suite — Pivot Advisor, GTM Strategy, North Star Metric, Investor One-Pager, Landing Copy, Term Sheet Explainer, Pricing Strategy, Hiring Plan, Fundraising Timeline" },
      { type: "new", text: "Community Hub — Job Board, Service Directory, Buddy System, Demo Day, Founder Circles, Events Calendar" },
      { type: "new", text: "Startup DNA Quiz — discover your founder archetype (Visionary, Executor, Networker, Builder)" },
      { type: "new", text: "OKR Tracker — set and track quarterly objectives and key results" },
      { type: "new", text: "NPS survey after completing evaluations" },
      { type: "new", text: "In-app feedback button (right side of every page)" },
      { type: "new", text: "Article bookmarks — save insights for later" },
      { type: "new", text: "Mobile bottom navigation for key pages" },
      { type: "new", text: "Onboarding checklist for new founders" },
      { type: "improved", text: "Admin panel: Feature flags, Announcement banner, Revenue goals, Audit log, NPS & Feedback tabs, Payment Gate control" },
      { type: "improved", text: "Global accessibility — platform now works for founders worldwide, not just India" },
      { type: "improved", text: "AI pricing: first use free, ₹2999 thereafter — admin-adjustable from panel" },
    ],
  },
  {
    date: "April 2026",
    version: "1.5",
    tag: "release",
    changes: [
      { type: "new", text: "Pitch Practice — AI investor simulation with real-time feedback" },
      { type: "new", text: "Brainstorm Board — collaborative idea mapping" },
      { type: "new", text: "Founder Match — connect with complementary founders" },
      { type: "new", text: "Weekly Journal — weekly reflection and planning tool" },
      { type: "new", text: "Investor CRM — track your fundraising pipeline" },
      { type: "new", text: "Founder Feed — community posts and startup updates" },
      { type: "improved", text: "Agent platform — full agent dashboard and client management" },
    ],
  },
  {
    date: "March 2026",
    version: "1.0",
    tag: "release",
    changes: [
      { type: "new", text: "Founder Readiness Check — 50-question AI evaluation" },
      { type: "new", text: "Startup Viability Advisor — AI advisor tool" },
      { type: "new", text: "Pitch Deck Validator — AI-powered deck analysis" },
      { type: "new", text: "Runway Calculator — cash flow and burn rate tool" },
      { type: "new", text: "Insights Blog — startup knowledge base" },
      { type: "new", text: "Admin Dashboard — full analytics and session management" },
      { type: "new", text: "Coupon system and Razorpay payment integration" },
    ],
  },
];

const TAG_CONFIG = {
  major: "bg-[#E8A838]/20 text-[#E8A838] border-[#E8A838]/30",
  release: "bg-blue-900/20 text-blue-400 border-blue-800/30",
  hotfix: "bg-red-900/20 text-red-400 border-red-800/30",
};

const TYPE_CONFIG = {
  new: { label: "New", color: "text-green-400 bg-green-900/20 border-green-800/30" },
  improved: { label: "Improved", color: "text-blue-400 bg-blue-900/20 border-blue-800/30" },
  fixed: { label: "Fixed", color: "text-yellow-400 bg-yellow-900/20 border-yellow-800/30" },
};

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <p className="text-[#555] text-xs tracking-widest uppercase mb-2">What&apos;s new</p>
          <h1 className="font-crimson text-3xl font-semibold text-white mb-3">Changelog</h1>
          <p className="text-[#444] text-sm">Every update, feature, and fix — tracked publicly.</p>
        </div>

        <div className="space-y-10">
          {ENTRIES.map((entry) => (
            <div key={entry.version}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[#555] text-sm">{entry.date}</span>
                <span className="text-white font-bold text-sm">v{entry.version}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${TAG_CONFIG[entry.tag as keyof typeof TAG_CONFIG] ?? TAG_CONFIG.release}`}>
                  {entry.tag}
                </span>
              </div>
              <div className="border-l border-[#1a1a1a] pl-5 space-y-3">
                {entry.changes.map((change, i) => {
                  const cfg = TYPE_CONFIG[change.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.fixed;
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <span className={`text-[9px] px-2 py-0.5 rounded border shrink-0 mt-0.5 ${cfg.color}`}>{cfg.label}</span>
                      <p className="text-[#888] text-sm">{change.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
