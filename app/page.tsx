import LandingForm from "@/components/LandingForm";
import FAQ from "@/components/FAQ";
import { getSessionCount, getAllAdvisorSessions, getAllPitchDeckSessions } from "@/lib/db";

export const revalidate = 300;

export default async function HomePage() {
  let sessionCount: number | null = null;
  let advisorCount = 0;
  let pitchDeckCount = 0;

  try {
    sessionCount = await getSessionCount();
  } catch {}

  try {
    const [advisorSessions, pitchDeckSessions] = await Promise.all([
      getAllAdvisorSessions().catch(() => []),
      getAllPitchDeckSessions().catch(() => []),
    ]);
    advisorCount = advisorSessions.length;
    pitchDeckCount = pitchDeckSessions.length;
  } catch {}

  const hasAnyCounts = (sessionCount ?? 0) > 0 || advisorCount > 0 || pitchDeckCount > 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-3">Devbridge</p>
          <h1 className="font-crimson text-4xl sm:text-5xl font-semibold text-white leading-tight mb-3">
            Validate Before You Build
          </h1>
          <p className="text-[#888] text-base sm:text-lg">
            AI-powered startup tools for founders who want honest answers.
          </p>
          {hasAnyCounts && (
            <div className="flex justify-center gap-4 mt-3 flex-wrap">
              {(sessionCount ?? 0) > 0 && (
                <span className="text-[#555] text-xs">{sessionCount} readiness checks</span>
              )}
              {(sessionCount ?? 0) > 0 && advisorCount > 0 && (
                <span className="text-[#333]">·</span>
              )}
              {advisorCount > 0 && (
                <span className="text-[#555] text-xs">{advisorCount} advisor reports</span>
              )}
              {advisorCount > 0 && pitchDeckCount > 0 && (
                <span className="text-[#333]">·</span>
              )}
              {pitchDeckCount > 0 && (
                <span className="text-[#555] text-xs">{pitchDeckCount} pitch decks analysed</span>
              )}
            </div>
          )}
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-5 sm:p-7">
          <LandingForm />
        </div>

        <div className="mt-6 space-y-2">
          {[
            "Brutally honest AI evaluation — not a pitch validator, a readiness interrogation.",
            "Three tools: readiness check, viability advisor, and pitch deck analysis.",
            "Geography-aware · ₹999 per report · Results in under 60 seconds.",
          ].map((point, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[#E8A838] text-xs mt-0.5 shrink-0">▸</span>
              <p className="text-[#555] text-xs leading-relaxed">{point}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4">
          <p className="text-xs text-[#444] leading-relaxed">
            <span className="text-[#555]">Privacy:</span> Your details are stored securely and used only to generate your report. We do not share or sell your data. Sessions are retained for 90 days.
          </p>
        </div>

        <FAQ />
      </div>

      <footer className="mt-12 text-center text-xs text-[#333] space-y-2">
        <p>AI-generated reports are advisory — not financial or legal advice.</p>
        <div className="flex justify-center gap-4 mt-1">
          <a href="/privacy-policy" className="hover:text-[#555] transition">Privacy</a>
          <a href="/terms" className="hover:text-[#555] transition">Terms</a>
          <a href="/refund-policy" className="hover:text-[#555] transition">Refunds</a>
          <a href="/contact" className="hover:text-[#555] transition">Contact</a>
        </div>
      </footer>
    </main>
  );
}
