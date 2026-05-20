import type { Metadata } from "next";
import Link from "next/link";
import AdvisorForm from "@/components/AdvisorForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Startup Viability Advisor — Devbridge",
  description: "Get a personalized startup viability assessment across 7 dimensions. AI-powered advisor with geography-specific insights, mental health screening, and 6 routing pathways.",
};

export default function AdvisorPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-[#555] text-sm hover:text-[#E8A838] transition mb-6 block">
          ← Back to Home
        </Link>

        <div className="mb-8">
          <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-2">Devbridge Advisor</p>
          <h1 className="font-crimson text-4xl sm:text-5xl text-white leading-tight mb-3">
            Startup Viability Check
          </h1>
          <p className="text-[#888] text-base">
            7-section intake. Honest AI evaluation. 6 routing pathways — from "launch now" to "stop and reconsider."
          </p>
        </div>

        {/* What you'll get */}
        <div className="grid grid-cols-2 gap-3 mb-7">
          {[
            { label: "Sections", value: "7" },
            { label: "Pathways", value: "6" },
            { label: "Dimensions", value: "4" },
            { label: "Minutes", value: "10–15" },
          ].map((item) => (
            <div key={item.label} className="bg-[#111] border border-[#222] rounded-xl py-3 px-4">
              <div className="text-[#E8A838] text-xl font-bold">{item.value}</div>
              <div className="text-[#555] text-xs mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-5 sm:p-7 mb-6">
          <Suspense>
          <AdvisorForm />
        </Suspense>
        </div>

        <div className="space-y-2 mb-6">
          {[
            "Covers founder readiness, idea viability, market opportunity, and execution risk.",
            "Geography-specific insights — regulations, funding ecosystem, market maturity.",
            "Honest mental health screening — timing matters as much as the idea.",
          ].map((point, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[#E8A838] text-xs mt-0.5 shrink-0">▸</span>
              <p className="text-[#555] text-xs leading-relaxed">{point}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 mb-8">
          <p className="text-xs text-[#444] leading-relaxed">
            <span className="text-[#555]">Note:</span> This evaluation is AI-generated advisory content — not legal or financial advice. Reports are stored for 24 hours and not shared.
          </p>
        </div>

        <footer className="text-center text-xs text-[#333] space-y-1">
          <div className="flex justify-center gap-4">
            <Link href="/privacy-policy" className="hover:text-[#555] transition">Privacy</Link>
            <Link href="/terms" className="hover:text-[#555] transition">Terms</Link>
            <Link href="/refund-policy" className="hover:text-[#555] transition">Refunds</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
