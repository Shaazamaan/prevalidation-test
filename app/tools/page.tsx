import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Tools — Devbridge",
  description: "10 AI-powered tools for startup founders. Pivot advisor, GTM strategy, investor one-pager, pricing strategy, and more.",
};

const TOOLS = [
  { slug: "pivot-advisor", label: "Pivot Advisor", desc: "Get 3 strategic pivot ideas when you're stuck.", icon: "⟳" },
  { slug: "interview-script", label: "Customer Interview Script", desc: "Validate assumptions with structured interviews.", icon: "◎" },
  { slug: "gtm-strategy", label: "Go-To-Market Strategy", desc: "Your 90-day GTM plan, built by AI.", icon: "→" },
  { slug: "north-star", label: "North Star Metric", desc: "The one metric that defines your success.", icon: "★" },
  { slug: "one-pager", label: "Investor One-Pager", desc: "A compelling one-page investor summary.", icon: "◻" },
  { slug: "landing-copy", label: "Landing Page Copy", desc: "High-converting copy for your homepage.", icon: "✎" },
  { slug: "term-sheet", label: "Term Sheet Explainer", desc: "Understand any term sheet clause in plain English.", icon: "◈" },
  { slug: "pricing-strategy", label: "Pricing Strategy", desc: "Optimal pricing model and price points.", icon: "₹" },
  { slug: "hiring-plan", label: "First Hiring Plan", desc: "Your year-one hiring roadmap.", icon: "◇" },
  { slug: "fundraising-timeline", label: "Fundraising Timeline", desc: "A realistic roadmap to your raise.", icon: "⌛" },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-2">AI Tools Suite</p>
          <h1 className="font-crimson text-3xl sm:text-4xl font-semibold text-white mb-3">10 tools. Every founder problem.</h1>
          <p className="text-[#555] text-base">First use is always free. ₹2,999 for subsequent uses — admin-adjustable.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group p-5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl hover:border-[#E8A838]/30 hover:bg-[#111] transition"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl text-[#E8A838] mt-0.5 shrink-0">{tool.icon}</span>
                <div>
                  <h2 className="text-white text-sm font-medium mb-1 group-hover:text-[#E8A838] transition">{tool.label}</h2>
                  <p className="text-[#444] text-xs leading-relaxed">{tool.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 p-5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl">
          <div className="flex items-start gap-4">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="text-white text-sm font-medium mb-1">First use is always free</h3>
              <p className="text-[#444] text-xs">Every tool gives you one free result so you can see the quality before paying. After that, it&apos;s a one-time payment per tool — no subscription, no recurring charges.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
