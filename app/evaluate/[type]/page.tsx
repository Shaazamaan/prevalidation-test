import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

const STARTUP_TYPES = {
  saas: {
    title: "SaaS Startup Readiness Check",
    description: "Is your SaaS startup ready to grow? Evaluate product-market fit, pricing, churn risk, and go-to-market strategy with AI.",
    emoji: "☁",
    questions: ["Do you have recurring revenue?", "What is your monthly churn rate?", "How long is your sales cycle?"],
    tips: ["Focus on net revenue retention above 100%", "Build in-product onboarding early", "Track activation rate before CAC"],
  },
  ecommerce: {
    title: "E-Commerce Startup Readiness Check",
    description: "Evaluate your e-commerce startup for supply chain readiness, unit economics, and customer acquisition cost.",
    emoji: "🛒",
    questions: ["What is your average order value?", "Have you validated supplier relationships?", "What is your CAC vs. LTV ratio?"],
    tips: ["Validate logistics before scaling marketing", "Build repeat purchase cadence from day 1", "Monitor return rates closely"],
  },
  marketplace: {
    title: "Marketplace Startup Readiness Check",
    description: "Solve the chicken-and-egg problem. Evaluate your marketplace for liquidity, supply-demand balance, and take rate.",
    emoji: "⚖",
    questions: ["Which side do you seed first?", "What is your take rate?", "How do you prevent disintermediation?"],
    tips: ["Solve supply first for most marketplaces", "Liquidity in a niche beats breadth early", "Track GMV, not just revenue"],
  },
  fintech: {
    title: "Fintech Startup Readiness Check",
    description: "Navigate regulatory compliance, trust building, and unit economics in financial services with AI-powered evaluation.",
    emoji: "₹",
    questions: ["Do you need an NBFC or payment aggregator license?", "How do you handle KYC?", "What is your fraud rate?"],
    tips: ["Compliance is a moat, not a burden", "Trust is your primary product", "Start with a niche segment"],
  },
  edtech: {
    title: "EdTech Startup Readiness Check",
    description: "Evaluate your EdTech startup for learning outcomes, completion rates, and B2C vs. B2B model fit.",
    emoji: "📚",
    questions: ["What is your course completion rate?", "B2C or B2B? Or both?", "How do you prove learning outcomes?"],
    tips: ["Completion rate is your north star", "B2B (institution sales) has higher LTV", "Outcomes beat credentials"],
  },
  healthtech: {
    title: "HealthTech Startup Readiness Check",
    description: "Assess your healthtech startup for regulatory path, clinical validation, and go-to-market strategy.",
    emoji: "⚕",
    questions: ["Do you need CDSCO approval?", "Have you done clinical validation?", "Who is the economic buyer?"],
    tips: ["Doctor adoption drives patient adoption", "Regulatory path defines your timeline", "Privacy is non-negotiable"],
  },
  b2b: {
    title: "B2B SaaS Readiness Check",
    description: "Evaluate your B2B startup for enterprise readiness, sales process, and product-led growth potential.",
    emoji: "🏢",
    questions: ["Average contract value?", "Sales-led or product-led?", "What does your champion map look like?"],
    tips: ["Build for the champion, sell to the buyer", "PS and CS are your growth engines early", "Case studies close enterprise deals"],
  },
  d2c: {
    title: "D2C Brand Readiness Check",
    description: "Evaluate your direct-to-consumer brand for margin structure, community, and channel mix.",
    emoji: "📦",
    questions: ["What is your gross margin?", "Do you have a community or just customers?", "Quick-commerce or delivery timeline?"],
    tips: ["Margin at scale beats growth at loss", "Community = CAC moat", "Own your customer data from day 1"],
  },
};

export async function generateStaticParams() {
  return Object.keys(STARTUP_TYPES).map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: { type: string } }): Promise<Metadata> {
  const data = STARTUP_TYPES[params.type as keyof typeof STARTUP_TYPES];
  if (!data) return { title: "Startup Evaluation — Devbridge" };
  return {
    title: `${data.title} — Devbridge`,
    description: data.description,
    openGraph: { title: data.title, description: data.description },
  };
}

export default function EvaluatePage({ params }: { params: { type: string } }) {
  const data = STARTUP_TYPES[params.type as keyof typeof STARTUP_TYPES];
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <div className="text-5xl mb-4">{data.emoji}</div>
          <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-2">Founder Readiness Check</p>
          <h1 className="font-crimson text-3xl sm:text-4xl font-semibold text-white mb-4">{data.title}</h1>
          <p className="text-[#666] text-base leading-relaxed">{data.description}</p>
        </div>

        <div className="mb-8 bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6">
          <h2 className="text-white text-sm font-medium mb-4">Key questions you&apos;ll answer</h2>
          <ul className="space-y-3">
            {data.questions.map((q, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-[#E8A838] font-bold text-sm shrink-0">{i + 1}.</span>
                <span className="text-[#888] text-sm">{q}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-8 bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6">
          <h2 className="text-white text-sm font-medium mb-4">What founders like you often miss</h2>
          <ul className="space-y-3">
            {data.tips.map((tip, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-green-400 shrink-0">→</span>
                <span className="text-[#888] text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#0d0d0d] border border-[#E8A838]/20 rounded-2xl p-6 text-center">
          <h2 className="font-crimson text-2xl text-white mb-2">Ready to evaluate your startup?</h2>
          <p className="text-[#555] text-sm mb-6">50 questions · AI analysis · Instant report</p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-[#E8A838] text-black font-semibold rounded-xl text-sm hover:bg-[#d4962e] transition"
          >
            Start Your Free Readiness Check →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(STARTUP_TYPES)
            .filter(([k]) => k !== params.type)
            .slice(0, 4)
            .map(([slug, info]) => (
              <Link
                key={slug}
                href={`/evaluate/${slug}`}
                className="p-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl hover:border-[#333] transition text-center"
              >
                <div className="text-xl mb-1">{info.emoji}</div>
                <p className="text-[#555] text-[10px] leading-tight">{slug.replace("-", " ")}</p>
              </Link>
            ))}
        </div>
      </div>
    </main>
  );
}
