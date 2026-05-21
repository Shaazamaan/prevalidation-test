"use client";

import type { Achievement } from "@/lib/db";

type Props = {
  achievements: Achievement[];
};

const ALL_BADGES = [
  { key: "first_eval",         icon: "🔍", label: "First Reality Check" },
  { key: "score_70",           icon: "🌟", label: "Scored 70+" },
  { key: "score_80",           icon: "🏆", label: "Scored 80+" },
  { key: "score_improved",     icon: "📈", label: "Score Improved" },
  { key: "three_tools",        icon: "🛠️", label: "3 Tools Done" },
  { key: "community_post",     icon: "💬", label: "Community Post" },
  { key: "journal_streak",     icon: "📝", label: "Journal Streak" },
  { key: "first_referral",     icon: "🤝", label: "First Referral" },
  { key: "referral_converted", icon: "💰", label: "Referral Converted" },
  { key: "profile_complete",   icon: "✅", label: "Profile Complete" },
];

export default function AchievementsPanel({ achievements }: Props) {
  if (achievements.length === 0) return null;

  const earnedKeys = new Set(achievements.map((a) => a.key));
  const earned = ALL_BADGES.filter((b) => earnedKeys.has(b.key));

  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-sm font-semibold">Achievements</h2>
        <span className="text-[10px] text-[#444]">{achievements.length}/{ALL_BADGES.length} earned</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {earned.map((badge) => (
          <div
            key={badge.key}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] border border-[#E8A838]/20 rounded-full"
            title={badge.label}
          >
            <span className="text-sm">{badge.icon}</span>
            <span className="text-xs text-[#888]">{badge.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
