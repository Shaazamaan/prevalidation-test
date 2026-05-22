import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Tools — Devbridge",
  description: "10 AI-powered tools for startup founders. Pivot advisor, GTM strategy, investor one-pager, pricing strategy, and more.",
};

const CORE_TOOLS = [
  {
    href: "/",
    label: "Founder Readiness Check",
    desc: "70-question evaluation across 14 phases. Know exactly where you stand.",
    badge: "Most Popular",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    href: "/advisor",
    label: "Startup Viability Advisor",
    desc: "7-section deep-dive analysis. Is your model fundable and scalable?",
    badge: null,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
      </svg>
    ),
  },
  {
    href: "/pitch-deck",
    label: "Pitch Deck Validator",
    desc: "Upload your deck. Get a DB Score + GR Score with actionable feedback.",
    badge: null,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
];

const TOOL_CATEGORIES = [
  {
    label: "Validate",
    desc: "Test assumptions before you build anything",
    tools: [
      { slug: "interview-script", label: "Customer Interview Script", desc: "Validate your biggest assumptions with structured discovery questions.", icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      )},
      { slug: "pivot-advisor", label: "Pivot Advisor", desc: "Struggling? Get 3 adjacent pivot ideas that preserve your strengths.", icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
      )},
    ],
  },
  {
    label: "Build & Position",
    desc: "Set up your metrics, pricing, and messaging",
    tools: [
      { slug: "north-star", label: "North Star Metric", desc: "The one metric that should drive every decision you make.", icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      )},
      { slug: "pricing-strategy", label: "Pricing Strategy", desc: "Optimal pricing model and price points for your market and stage.", icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
      )},
      { slug: "landing-copy", label: "Landing Page Copy", desc: "High-converting hero, features, FAQ, and CTA copy — instantly.", icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      )},
    ],
  },
  {
    label: "Go-to-Market",
    desc: "Execute your launch and growth plan",
    tools: [
      { slug: "gtm-strategy", label: "GTM Strategy", desc: "Your full 90-day go-to-market plan tailored to your stage and model.", icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
      )},
      { slug: "hiring-plan", label: "First Hiring Plan", desc: "Your year-one hiring roadmap — who to hire, when, and why.", icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
      )},
    ],
  },
  {
    label: "Fundraise",
    desc: "Prepare for your raise with confidence",
    tools: [
      { slug: "one-pager", label: "Investor One-Pager", desc: "A compelling single-page investor summary that opens doors.", icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      )},
      { slug: "fundraising-timeline", label: "Fundraising Timeline", desc: "A realistic milestone-based roadmap to closing your round.", icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      )},
      { slug: "term-sheet", label: "Term Sheet Explainer", desc: "Understand every clause in plain English — know what you're signing.", icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      )},
    ],
  },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 px-4">
      <div className="max-w-3xl mx-auto pt-10">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-2 font-medium">Devbridge Toolkit</p>
          <h1 className="font-crimson text-3xl sm:text-4xl font-semibold text-white mb-3 leading-tight">
            Every tool a founder needs.
          </h1>
          <p className="text-[#555] text-sm sm:text-base">
            First use of every tool is free. ₹999 for subsequent uses.
          </p>
        </div>

        {/* Core Evaluators */}
        <div className="mb-10">
          <p className="text-[#3a3a3a] text-xs uppercase tracking-widest font-medium mb-3">
            Core Evaluation Tools
          </p>
          <div className="space-y-2">
            {CORE_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex items-center gap-4 p-4 sm:p-5 bg-[#111] border border-[#1e1e1e]
                           rounded-2xl hover:border-[#E8A838]/25 hover:bg-[#141414] transition-all duration-150"
              >
                <span className="text-[#E8A838] shrink-0">{tool.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-white text-sm font-medium group-hover:text-[#E8A838] transition-colors duration-150">
                      {tool.label}
                    </h2>
                    {tool.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8A838]/10
                                       text-[#E8A838] border border-[#E8A838]/20 font-medium shrink-0">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[#484848] text-xs leading-relaxed">{tool.desc}</p>
                </div>
                <svg className="text-[#2a2a2a] group-hover:text-[#E8A838]/50 transition-colors duration-150 shrink-0"
                     width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* AI Tool Categories */}
        {TOOL_CATEGORIES.map((cat) => (
          <div key={cat.label} className="mb-8">
            <div className="flex items-baseline gap-3 mb-3">
              <p className="text-[#3a3a3a] text-xs uppercase tracking-widest font-medium">
                {cat.label}
              </p>
              <p className="text-[#2a2a2a] text-xs hidden sm:block">{cat.desc}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {cat.tools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="group flex items-start gap-3.5 p-4 bg-[#0d0d0d] border border-[#1a1a1a]
                             rounded-xl hover:border-[#E8A838]/20 hover:bg-[#111] transition-all duration-150"
                >
                  <span className="text-[#E8A838]/70 group-hover:text-[#E8A838] shrink-0 mt-0.5 transition-colors duration-150">
                    {tool.icon}
                  </span>
                  <div>
                    <h3 className="text-white text-sm font-medium mb-1 group-hover:text-[#E8A838] transition-colors duration-150">
                      {tool.label}
                    </h3>
                    <p className="text-[#444] text-xs leading-relaxed">{tool.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Free note */}
        <div className="mt-4 p-4 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl flex items-start gap-3">
          <svg className="text-[#E8A838] shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
          </svg>
          <p className="text-[#484848] text-xs leading-relaxed">
            <span className="text-[#666] font-medium">First use is always free.</span>{" "}
            Every tool gives you one free result so you can see the quality before paying.
            After that, it&apos;s a one-time ₹999 per tool — no subscription, no recurring charges.
          </p>
        </div>

      </div>
    </main>
  );
}
