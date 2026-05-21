"use client";
import { useState } from "react";
import Link from "next/link";

const STEPS = [
  { key: "first_eval", label: "Run your first evaluation", description: "Complete a Readiness Check, Advisor, or Pitch Deck session.", href: "/" },
  { key: "joined_feed", label: "Post in the Founder Feed", description: "Share an update, question, or insight with the community.", href: "/feed" },
  { key: "set_crm", label: "Add an investor to your CRM", description: "Track your fundraising pipeline in one place.", href: "/crm" },
  { key: "wrote_journal", label: "Write your first journal entry", description: "Reflect on your week and plan ahead.", href: "/journal" },
  { key: "set_match_profile", label: "Set up your Match profile", description: "Find co-founders and collaborators.", href: "/match" },
];

export default function OnboardingChecklist({ completedSteps }: { completedSteps: string[] }) {
  const [dismissed, setDismissed] = useState(false);
  const done = completedSteps.length;
  const total = STEPS.length;
  const pct = Math.round((done / total) * 100);

  if (dismissed || done === total) return null;

  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white text-sm font-medium">Getting started</h3>
          <p className="text-[#444] text-xs mt-0.5">{done}/{total} steps · {pct}% complete</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-[#333] hover:text-[#666] transition text-xs">Dismiss</button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#1a1a1a] rounded-full h-1 mb-4">
        <div className="bg-[#E8A838] h-1 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-2">
        {STEPS.map((step) => {
          const isComplete = completedSteps.includes(step.key);
          return (
            <Link
              key={step.key}
              href={step.href}
              className={`flex items-start gap-3 p-3 rounded-xl transition ${isComplete ? "opacity-40" : "hover:bg-[#111]"}`}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${isComplete ? "bg-[#E8A838] border-[#E8A838]" : "border-[#333]"}`}>
                {isComplete && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-sm ${isComplete ? "text-[#444] line-through" : "text-white"}`}>{step.label}</p>
                {!isComplete && <p className="text-[#444] text-xs mt-0.5">{step.description}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
