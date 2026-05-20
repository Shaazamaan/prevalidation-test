import FounderForm from "@/components/FounderForm";
import SampleReportModal from "@/components/SampleReportModal";
import { getSessionCount } from "@/lib/db";

export const revalidate = 300;

export default async function HomePage() {
  let sessionCount: number | null = null;
  try {
    sessionCount = await getSessionCount();
  } catch {}

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-lg">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="font-crimson text-4xl sm:text-5xl font-semibold text-white leading-tight mb-3">
            Are You Ready to Validate?
          </h1>
          <p className="text-[#888] text-base sm:text-lg mb-3">
            Find out before you waste a single day.
          </p>
          {sessionCount !== null && sessionCount > 0 && (
            <p className="text-[#555] text-sm mb-2">
              {sessionCount.toLocaleString()} founder{sessionCount !== 1 ? "s" : ""} have completed this check.
            </p>
          )}
          <SampleReportModal />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8 text-center">
          {[
            { label: "Questions", value: "70" },
            { label: "Dimensions", value: "14" },
            { label: "Minutes", value: "25–35" },
          ].map((item) => (
            <div key={item.label} className="bg-[#111] border border-[#222] rounded-xl py-3 px-2">
              <div className="text-[#E8A838] text-xl font-bold">{item.value}</div>
              <div className="text-[#555] text-xs mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-5 sm:p-7">
          <FounderForm />
        </div>

        {/* What to expect */}
        <div className="mt-6 space-y-2">
          {[
            "Not a pitch evaluation — a readiness interrogation.",
            "Covers problem clarity, market reality, financial assumptions, and execution risk.",
            "Generates a report with a verdict, reality score, and specific next steps.",
          ].map((point, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[#E8A838] text-xs mt-0.5 shrink-0">▸</span>
              <p className="text-[#555] text-xs leading-relaxed">{point}</p>
            </div>
          ))}
        </div>

        {/* Privacy notice */}
        <div className="mt-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4">
          <p className="text-xs text-[#444] leading-relaxed">
            <span className="text-[#555]">Privacy:</span> Your answers are stored securely and used only to generate your report. We do not share individual session data. Sessions are retained for 90 days and then automatically deleted.
          </p>
        </div>
      </div>

      <footer className="mt-12 text-center text-xs text-[#333] space-y-1">
        <p>This is a readiness check, not a pitch evaluation or funding tool.</p>
        <p>AI-generated reports are a starting point for thinking, not a final verdict.</p>
      </footer>
    </main>
  );
}
