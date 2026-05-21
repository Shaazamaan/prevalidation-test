import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getAIFeatureUsageCount, getAIFeaturePrice } from "@/lib/db";
import type { Metadata } from "next";

// Tool component imports
import PivotAdvisor from "@/components/tools/PivotAdvisor";
import InterviewScript from "@/components/tools/InterviewScript";
import GTMStrategy from "@/components/tools/GTMStrategy";
import NorthStar from "@/components/tools/NorthStar";
import OnePager from "@/components/tools/OnePager";
import LandingCopy from "@/components/tools/LandingCopy";
import TermSheet from "@/components/tools/TermSheet";
import PricingStrategy from "@/components/tools/PricingStrategy";
import HiringPlan from "@/components/tools/HiringPlan";
import FundraisingTimeline from "@/components/tools/FundraisingTimeline";

const TOOLS: Record<string, {
  label: string;
  description: string;
  feature: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>;
}> = {
  "pivot-advisor": {
    label: "Pivot Advisor",
    description: "Get 3 strategic pivot ideas tailored to your startup's biggest weakness.",
    feature: "pivot_advisor",
    Component: PivotAdvisor,
  },
  "interview-script": {
    label: "Customer Interview Script",
    description: "Generate a structured interview script to validate your startup assumptions.",
    feature: "interview_script",
    Component: InterviewScript,
  },
  "gtm-strategy": {
    label: "Go-To-Market Strategy",
    description: "Build a 90-day go-to-market plan tailored to your startup.",
    feature: "gtm_strategy",
    Component: GTMStrategy,
  },
  "north-star": {
    label: "North Star Metric",
    description: "Define the single metric that best captures your startup's core value.",
    feature: "north_star",
    Component: NorthStar,
  },
  "one-pager": {
    label: "Investor One-Pager",
    description: "Generate a compelling one-page summary for investors.",
    feature: "one_pager",
    Component: OnePager,
  },
  "landing-copy": {
    label: "Landing Page Copy",
    description: "Write high-converting landing page copy for your startup.",
    feature: "landing_copy",
    Component: LandingCopy,
  },
  "term-sheet": {
    label: "Term Sheet Explainer",
    description: "Get plain-language explanations of any term sheet clause.",
    feature: "term_sheet",
    Component: TermSheet,
  },
  "pricing-strategy": {
    label: "Pricing Strategy",
    description: "Discover the optimal pricing model and price points for your startup.",
    feature: "pricing_strategy",
    Component: PricingStrategy,
  },
  "hiring-plan": {
    label: "First Hiring Plan",
    description: "Build your first-year hiring roadmap based on your stage and goals.",
    feature: "hiring_plan",
    Component: HiringPlan,
  },
  "fundraising-timeline": {
    label: "Fundraising Timeline",
    description: "Create a realistic fundraising roadmap aligned to your traction.",
    feature: "fundraising_timeline",
    Component: FundraisingTimeline,
  },
};

export async function generateMetadata({ params }: { params: { tool: string } }): Promise<Metadata> {
  const tool = TOOLS[params.tool];
  if (!tool) return { title: "Tool Not Found — Devbridge" };
  return {
    title: `${tool.label} — Devbridge AI Tools`,
    description: tool.description,
  };
}

export default async function ToolPage({ params }: { params: { tool: string } }) {
  const toolConfig = TOOLS[params.tool];
  if (!toolConfig) notFound();

  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const email = session.user.email.toLowerCase();
  const [usageCount, price] = await Promise.all([
    getAIFeatureUsageCount(email, toolConfig.feature),
    getAIFeaturePrice(),
  ]);
  const isFree = usageCount === 0;
  const { Component, label, description } = toolConfig;

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-2">AI Tools</p>
          <h1 className="font-crimson text-3xl font-semibold text-white mb-2">{label}</h1>
          <p className="text-[#555] text-sm">{description}</p>
          {isFree ? (
            <span className="inline-block mt-3 text-xs px-3 py-1 rounded-full bg-green-900/30 border border-green-800/40 text-green-400">
              First use — free
            </span>
          ) : (
            <span className="inline-block mt-3 text-xs px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#333] text-[#E8A838]">
              ₹{(price / 100).toLocaleString()} · One-time payment
            </span>
          )}
        </div>

        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6">
          <Component sessionEmail={email} isFree={isFree} price={price} />
        </div>
      </div>
    </main>
  );
}
