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

  const totalChecks = (sessionCount ?? 0) + advisorCount + pitchDeckCount;
  const hasAnyCounts = totalChecks > 0;

  return (
    <main className="min-h-[calc(100vh-3rem)] bg-[#0a0a0a] relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(232,168,56,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-4 pt-10 pb-20">
        <div className="w-full max-w-lg">

          {/* Badge */}
          <div className="flex justify-center mb-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                            bg-[#E8A838]/10 border border-[#E8A838]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8A838] animate-pulse shrink-0" />
              <span className="text-[#E8A838] text-xs font-medium tracking-wide">
                AI Tools for Indian Founders
              </span>
            </div>
          </div>

          {/* Hero */}
          <div className="text-center mb-8">
            <h1 className="font-crimson text-[2.6rem] sm:text-[3.5rem] font-semibold text-white
                           leading-[1.08] tracking-tight mb-4">
              Know If Your Startup<br />
              <span className="text-[#E8A838]">Is Actually Ready</span>
            </h1>
            <p className="text-[#666] text-base sm:text-[1.05rem] leading-relaxed max-w-[340px] mx-auto">
              Brutally honest AI evaluation — before you waste time, money, or momentum.
            </p>

            {/* Stats */}
            {hasAnyCounts && (
              <div className="flex justify-center items-center gap-6 mt-6">
                {(sessionCount ?? 0) > 0 && (
                  <div className="text-center">
                    <div className="text-white font-semibold text-lg tabular-nums leading-none">
                      {sessionCount}
                    </div>
                    <div className="text-[#3a3a3a] text-[11px] mt-1">Checks done</div>
                  </div>
                )}
                {(sessionCount ?? 0) > 0 && advisorCount > 0 && (
                  <div className="w-px h-6 bg-[#1a1a1a]" />
                )}
                {advisorCount > 0 && (
                  <div className="text-center">
                    <div className="text-white font-semibold text-lg tabular-nums leading-none">
                      {advisorCount}
                    </div>
                    <div className="text-[#3a3a3a] text-[11px] mt-1">Advisor reports</div>
                  </div>
                )}
                {advisorCount > 0 && pitchDeckCount > 0 && (
                  <div className="w-px h-6 bg-[#1a1a1a]" />
                )}
                {pitchDeckCount > 0 && (
                  <div className="text-center">
                    <div className="text-white font-semibold text-lg tabular-nums leading-none">
                      {pitchDeckCount}
                    </div>
                    <div className="text-[#3a3a3a] text-[11px] mt-1">Pitch decks</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form card — gradient border */}
          <div className="rounded-2xl p-px mb-5"
               style={{ background: "linear-gradient(160deg, #2a2a2a 0%, #141414 60%, #1a1a1a 100%)" }}>
            <div className="bg-[#111] rounded-2xl p-5 sm:p-7">
              <LandingForm />
            </div>
          </div>

          {/* Feature bullets */}
          <div className="space-y-2 mb-5">
            {[
              "Brutally honest AI evaluation — not a pitch validator, a readiness interrogation.",
              "Three tools: readiness check, viability advisor, and pitch deck analysis.",
              "Geography-aware · ₹999 per report · Results in under 60 seconds.",
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-3 px-3.5 py-2.5 rounded-xl
                                       bg-[#0d0d0d] border border-[#161616]">
                <svg
                  className="w-3.5 h-3.5 text-[#E8A838] shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-[#555] text-xs leading-relaxed">{point}</p>
              </div>
            ))}
          </div>

          {/* Privacy */}
          <div className="bg-[#0d0d0d] border border-[#161616] rounded-xl p-4 mb-2">
            <p className="text-xs text-[#3a3a3a] leading-relaxed">
              <span className="text-[#4a4a4a]">Privacy:</span>{" "}
              Your details are stored securely and used only to generate your report.
              We do not share or sell your data. Sessions are retained for 90 days.
            </p>
          </div>

          <FAQ />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-[#2e2e2e] space-y-2">
          <p>AI-generated reports are advisory — not financial or legal advice.</p>
          <div className="flex justify-center gap-5 mt-1.5">
            <a href="/privacy-policy" className="hover:text-[#555] transition-colors duration-150">Privacy</a>
            <a href="/terms" className="hover:text-[#555] transition-colors duration-150">Terms</a>
            <a href="/refund-policy" className="hover:text-[#555] transition-colors duration-150">Refunds</a>
            <a href="/contact" className="hover:text-[#555] transition-colors duration-150">Contact</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
