"use client";

import Link from "next/link";
import type { Report, Session, AdvisorSession, PitchDeckSession } from "@/lib/db";

type Reports = {
  readiness: (Session & { report: Report | null })[];
  advisor: AdvisorSession[];
  pitchDeck: PitchDeckSession[];
};

type Action = {
  label: string;
  description: string;
  href: string;
  cta: string;
  priority: "high" | "medium" | "low";
  badge?: string;
};

function getRecommendedActions(reports: Reports, onboardingSteps: string[]): Action[] {
  const actions: Action[] = [];
  const latestReadiness = reports.readiness.find((s) => s.report);
  const score = latestReadiness?.report?.realityScore;
  const verdict = latestReadiness?.report?.verdict;
  const hasAdvisor = reports.advisor.length > 0;
  const hasPitchDeck = reports.pitchDeck.length > 0;
  const hasJournal = onboardingSteps.includes("wrote_journal");
  const hasFeed = onboardingSteps.includes("joined_feed");
  const hasMatch = onboardingSteps.includes("set_match_profile");
  const hasCRM = onboardingSteps.includes("set_crm");

  // Score-based primary actions
  if (score !== undefined && verdict) {
    if (verdict === "READY" && !hasPitchDeck) {
      actions.push({
        label: "Validate your pitch",
        description: `You scored ${score}/100 — strong enough to start fundraising. Get your pitch deck stress-tested before your first investor meeting.`,
        href: "/pitch-deck",
        cta: "Evaluate Pitch Deck",
        priority: "high",
        badge: "Recommended for READY founders",
      });
    }

    if ((verdict === "CONDITIONALLY READY" || verdict === "NOT READY") && !hasAdvisor) {
      actions.push({
        label: "Get a strategic pathway",
        description: `Your score (${score}/100) flags specific gaps. The Advisor Report gives you a concrete path — bootstrap, raise, or validate differently.`,
        href: "/advisor",
        cta: "Run Advisor Report",
        priority: "high",
        badge: "Based on your score",
      });
    }

    if ((score ?? 0) >= 60 && !hasAdvisor && verdict !== "NOT READY") {
      actions.push({
        label: "Map your funding pathway",
        description: "With a solid foundation, now's the time to understand which fundraising path fits your startup — bootstrap, angels, or VCs.",
        href: "/advisor",
        cta: "Run Advisor Report",
        priority: "high",
        badge: "Next logical step",
      });
    }
  }

  // Tool recommendations based on gaps
  if (!hasCRM && (score ?? 0) >= 50) {
    actions.push({
      label: "Track your investor conversations",
      description: "Founders who start tracking investor conversations early close rounds 40% faster. Build the habit now.",
      href: "/crm",
      cta: "Open Investor CRM",
      priority: "medium",
    });
  }

  if (!hasFeed) {
    actions.push({
      label: "Get feedback from real founders",
      description: "Post your idea in the Founder Feed. Harsh, honest, helpful — the community gives feedback VCs won't.",
      href: "/feed",
      cta: "Post in Feed",
      priority: "medium",
    });
  }

  if (!hasMatch && (score ?? 0) >= 40) {
    actions.push({
      label: "Find a co-founder",
      description: "Solo founders are 2x more likely to pivot into oblivion. Set up your match profile and find the person who fills your gaps.",
      href: "/match",
      cta: "Set Up Match Profile",
      priority: "medium",
    });
  }

  if (!hasJournal) {
    actions.push({
      label: "Start your weekly journal",
      description: "One journal entry per week compounds into the clearest view of your progress. Takes 3 minutes.",
      href: "/journal",
      cta: "Write Journal Entry",
      priority: "low",
    });
  }

  // Always recommend pitch practice if no pitch deck yet
  if (!hasPitchDeck && reports.readiness.length > 0) {
    actions.push({
      label: "Practice your pitch out loud",
      description: "The AI pitch coach gives you real-time feedback on clarity, conviction, and investor-readiness.",
      href: "/pitch-practice",
      cta: "Practice Pitch",
      priority: "low",
    });
  }

  // Re-evaluate nudge
  if (latestReadiness) {
    const daysAgo = Math.floor((Date.now() - latestReadiness.createdAt) / (1000 * 60 * 60 * 24));
    if (daysAgo >= 21) {
      actions.unshift({
        label: "Re-evaluate your startup",
        description: `It's been ${daysAgo} days since your last check. Founders who re-evaluate after addressing gaps consistently score 10-15 points higher.`,
        href: "/",
        cta: "Re-run Readiness Check",
        priority: "high",
        badge: `${daysAgo} days since last eval`,
      });
    }
  }

  // Deduplicate and sort by priority
  const seen = new Set<string>();
  return actions
    .filter((a) => { const k = a.href; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 3);
}

type Props = {
  reports: Reports;
  onboardingSteps: string[];
};

export default function NextStepPanel({ reports, onboardingSteps }: Props) {
  const actions = getRecommendedActions(reports, onboardingSteps);
  if (actions.length === 0) return null;

  return (
    <div className="bg-[#0d0d0d] border border-[#E8A838]/15 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#E8A838] text-base">→</span>
        <h2 className="text-white text-sm font-semibold">Your next moves</h2>
      </div>
      <div className="space-y-3">
        {actions.map((action) => (
          <div key={action.href} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-white text-sm font-medium">{action.label}</p>
                {action.badge && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#E8A838]/10 border border-[#E8A838]/20 text-[#E8A838] font-medium shrink-0">
                    {action.badge}
                  </span>
                )}
              </div>
              <p className="text-[#555] text-xs leading-relaxed">{action.description}</p>
            </div>
            <Link
              href={action.href}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                action.priority === "high"
                  ? "bg-[#E8A838] text-black hover:bg-[#d4962e]"
                  : "bg-[#1a1a1a] border border-[#333] text-[#888] hover:text-white hover:border-[#555]"
              }`}
            >
              {action.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
