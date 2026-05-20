import type { Metadata } from "next";
import Link from "next/link";
import PitchDeckForm from "@/components/PitchDeckForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Pitch Deck Validator — Devbridge",
  description: "Upload your pitch deck and get a comprehensive AI evaluation. DB Score (investment readiness), GR Score (grant readiness), 23 dimensions across 15 startup tracks.",
  keywords: ["pitch deck validator", "pitch deck analysis", "DB Score", "GR Score", "startup pitch India", "pitch deck AI review", "grant readiness"],
};

export default function PitchDeckPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-[#555] text-sm hover:text-[#E8A838] transition mb-6 block">
          ← Back to Home
        </Link>

        <div className="mb-8">
          <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-2">Devbridge Pitch Analysis</p>
          <h1 className="font-crimson text-4xl sm:text-5xl text-white leading-tight mb-3">
            Pitch Deck Validator
          </h1>
          <p className="text-[#888] text-base">
            Upload your deck. Get your DB Score (investment readiness) and GR Score (grant readiness) — across 23 dimensions.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { label: "Tracks", value: "15" },
            { label: "Dimensions", value: "23" },
            { label: "Scores", value: "2" },
          ].map((item) => (
            <div key={item.label} className="bg-[#111] border border-[#222] rounded-xl py-3 px-2 text-center">
              <div className="text-[#E8A838] text-xl font-bold">{item.value}</div>
              <div className="text-[#555] text-xs mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-5 sm:p-7 mb-6">
          <Suspense fallback={
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#555] text-sm">Loading…</p>
            </div>
          }>
            <PitchDeckForm />
          </Suspense>
        </div>

        <div className="space-y-2 mb-6">
          {[
            "DB Score evaluates investment readiness across 12 dimensions — problem, market, team, traction, moat, and more.",
            "GR Score evaluates grant eligibility across 11 dimensions — impact, innovation, inclusivity, sustainability.",
            "Slide-by-slide feedback with exact rewrite suggestions for weak slides.",
          ].map((point, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[#E8A838] text-xs mt-0.5 shrink-0">▸</span>
              <p className="text-[#555] text-xs leading-relaxed">{point}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 mb-8">
          <p className="text-xs text-[#444] leading-relaxed">
            <span className="text-[#555]">Privacy:</span> Your pitch deck is sent to Claude AI for analysis. It is not stored permanently and is not used for training. Treat this as confidential — do not upload decks with sensitive data you wouldn't share with an advisor.
          </p>
        </div>

        <footer className="text-center text-xs text-[#333] space-y-1">
          <div className="flex justify-center gap-4">
            <Link href="/privacy-policy" className="hover:text-[#555] transition">Privacy</Link>
            <Link href="/terms" className="hover:text-[#555] transition">Terms</Link>
            <Link href="/refund-policy" className="hover:text-[#555] transition">Refunds</Link>
            <Link href="/contact" className="hover:text-[#555] transition">Contact</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
