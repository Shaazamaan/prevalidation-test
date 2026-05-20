"use client";

import { useState, useEffect } from "react";
import PaymentModal, { type PaymentResult } from "@/components/PaymentModal";
import type { AdvisorIntake } from "@/lib/advisor-prompt";

type AdvisorReport = Record<string, unknown> & {
  pathway: string;
  pathwayLabel: string;
  overallScore: number;
  founderReadinessScore: number;
  ideaViabilityScore: number;
  verdict: string;
  strengths: { area: string; insight: string }[];
  criticalGaps: { gap: string; severity: string; fix: string }[];
  geographyInsights: { location: string; opportunities: string[]; risks: string[]; fundingEcosystem: string; regulatoryNotes: string };
  mentalHealthFlag: boolean;
  mentalHealthNote: string | null;
  immediateNextSteps: { step: string; timeline: string; priority: number }[];
  validationExperiments: { experiment: string; successMetric: string; cost: string; timeframe: string }[];
  pivotOptions: { direction: string; rationale: string }[];
  resourcesNeeded: { capital: string; skills: string[]; time: string };
  finalMessage: string;
};

const PATHWAY_COLORS: Record<string, string> = {
  "PATHWAY 1": "text-green-400 border-green-800 bg-green-900/20",
  "PATHWAY 2": "text-amber-400 border-amber-800 bg-amber-900/20",
  "PATHWAY 3": "text-blue-400 border-blue-800 bg-blue-900/20",
  "PATHWAY 4": "text-purple-400 border-purple-800 bg-purple-900/20",
  "PATHWAY 5": "text-orange-400 border-orange-800 bg-orange-900/20",
  "PATHWAY 6": "text-red-400 border-red-800 bg-red-900/20",
};

const SECTIONS = [
  { id: "A", label: "Founder Background" },
  { id: "B", label: "Problem & Market" },
  { id: "C", label: "Solution" },
  { id: "D", label: "Business Model" },
  { id: "E", label: "Traction & Validation" },
  { id: "F", label: "Team" },
  { id: "G", label: "Readiness" },
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-[#888] uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition";
const TEXTAREA = `${INPUT} resize-none`;

const PROFILE_KEY = "dbk_profile";

function loadProfile(): { name?: string; email?: string; phone?: string; country?: string; countryCode?: string } {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export default function AdvisorForm() {
  const [section, setSection] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [intake, setIntake] = useState<Partial<AdvisorIntake>>({});
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<AdvisorReport | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCountry, setProfileCountry] = useState("");

  // Pre-fill from landing page profile (runs once on mount)
  useEffect(() => {
    if (profileLoaded) return;
    const p = loadProfile();
    setProfileLoaded(true);
    if (p.email) setProfileEmail(p.email);
    if (p.phone) setProfilePhone(`${p.countryCode ?? ""} ${p.phone ?? ""}`.trim());
    if (p.country) setProfileCountry(p.country);
    const last = localStorage.getItem("dbk_last_advisor");
    if (last) setLastSessionId(last);
    setIntake((prev) => ({
      ...prev,
      founderName: prev.founderName || p.name || "",
      location: prev.location || p.country || "",
    }));
  }, [profileLoaded]);

  const set = (field: keyof AdvisorIntake) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setIntake((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const canProceedA = !!(intake.founderName && intake.location && intake.relevantSkills);
  const canProceedB = !!(intake.problemStatement && intake.targetCustomer && intake.existingSolutions && intake.problemFrequency);
  const canProceedC = !!(intake.solution && intake.uniqueAdvantage);
  const canProceedD = !!(intake.revenueModel);
  const canProceedE = true;
  const canProceedF = !!(intake.teamSize);
  const canProceedG = !!(intake.timeCommitment && intake.motivationSource);

  const canProceed = [canProceedA, canProceedB, canProceedC, canProceedD, canProceedE, canProceedF, canProceedG][section];

  const handleNext = () => {
    if (section < SECTIONS.length - 1) {
      setSection((s) => s + 1);
    } else {
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = async (payment: PaymentResult) => {
    setShowPayment(false);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/advisor/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake,
          payment,
          founderEmail: profileEmail || undefined,
          founderPhone: profilePhone || undefined,
          founderCountry: profileCountry || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Evaluation failed. Please try again.");
        setLoading(false);
        return;
      }

      setReport(data.report as AdvisorReport);
      if (data.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem("dbk_last_advisor", data.sessionId);
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="font-crimson text-2xl text-white mb-2">Analyzing your startup…</p>
        <p className="text-[#666] text-sm">This takes 20–40 seconds.</p>
      </div>
    );
  }

  if (report) {
    const pathwayColor = PATHWAY_COLORS[report.pathway] ?? "text-[#E8A838] border-[#444] bg-[#111]";
    return (
      <div className="space-y-6">
        {/* Verdict banner */}
        <div className={`border rounded-xl p-5 ${pathwayColor}`}>
          <p className="text-xs uppercase tracking-widest mb-1 opacity-70">{report.pathway}</p>
          <p className="text-2xl font-crimson font-semibold">{report.pathwayLabel}</p>
          <p className="text-sm mt-2 opacity-90">{report.verdict}</p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Overall", score: report.overallScore },
            { label: "Founder", score: report.founderReadinessScore },
            { label: "Idea", score: report.ideaViabilityScore },
            { label: "Market Opp.", score: report.marketOpportunityScore as number },
          ].map((s) => (
            <div key={s.label} className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
              <p className="text-[#E8A838] text-2xl font-bold">{s.score ?? "—"}</p>
              <p className="text-[#555] text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mental health flag */}
        {report.mentalHealthFlag && report.mentalHealthNote && (
          <div className="bg-orange-900/20 border border-orange-800/40 rounded-xl p-4">
            <p className="text-orange-400 text-xs uppercase tracking-wide mb-2">Founder Wellbeing Note</p>
            <p className="text-[#ccc] text-sm">{report.mentalHealthNote}</p>
          </div>
        )}

        {/* Strengths */}
        {report.strengths.length > 0 && (
          <div>
            <h3 className="text-white text-base font-semibold mb-3">Strengths</h3>
            <div className="space-y-2">
              {report.strengths.map((s, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-3">
                  <p className="text-green-400 text-xs uppercase mb-1">{s.area}</p>
                  <p className="text-[#888] text-sm">{s.insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical gaps */}
        {report.criticalGaps.length > 0 && (
          <div>
            <h3 className="text-white text-base font-semibold mb-3">Critical Gaps</h3>
            <div className="space-y-2">
              {report.criticalGaps.map((g, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-red-400 text-xs uppercase">{g.gap}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      g.severity === "HIGH" ? "border-red-800 text-red-400" :
                      g.severity === "MEDIUM" ? "border-amber-800 text-amber-400" :
                      "border-[#333] text-[#666]"
                    }`}>{g.severity}</span>
                  </div>
                  <p className="text-[#888] text-sm">{g.fix}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Geography */}
        {report.geographyInsights && (
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <h3 className="text-white text-sm font-semibold mb-3">{report.geographyInsights.location} — Local Context</h3>
            {report.geographyInsights.fundingEcosystem && (
              <p className="text-[#666] text-xs mb-2">{report.geographyInsights.fundingEcosystem}</p>
            )}
            {report.geographyInsights.opportunities?.map((o, i) => (
              <p key={i} className="text-xs text-green-400 mb-1">▸ {o}</p>
            ))}
            {report.geographyInsights.risks?.map((r, i) => (
              <p key={i} className="text-xs text-red-400 mb-1">▾ {r}</p>
            ))}
          </div>
        )}

        {/* Next steps */}
        {report.immediateNextSteps.length > 0 && (
          <div>
            <h3 className="text-white text-base font-semibold mb-3">Immediate Next Steps</h3>
            <div className="space-y-2">
              {report.immediateNextSteps.sort((a, b) => a.priority - b.priority).map((s, i) => (
                <div key={i} className="flex items-start gap-3 bg-[#111] border border-[#222] rounded-lg p-3">
                  <span className="text-[#E8A838] font-bold text-sm shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-white text-sm">{s.step}</p>
                    <p className="text-[#555] text-xs mt-1">{s.timeline}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final message */}
        <div className="bg-[#E8A838]/10 border border-[#E8A838]/30 rounded-xl p-5">
          <p className="text-xs text-[#E8A838] uppercase tracking-wide mb-2">Message from Devbridge</p>
          <p className="text-[#ccc] text-sm leading-relaxed">{report.finalMessage}</p>
        </div>

        {/* Share link */}
        {sessionId && (
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
            <p className="text-xs text-[#555] uppercase tracking-wide mb-2">Share Your Report</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/advisor/report/${sessionId}`}
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#888] text-xs truncate focus:outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/advisor/report/${sessionId}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="shrink-0 text-xs px-3 py-2 bg-[#E8A838] text-black rounded-lg font-medium hover:bg-[#d4962e] transition"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => { setReport(null); setSection(0); setIntake({}); setSessionId(null); }}
          className="w-full bg-[#111] border border-[#222] text-[#666] py-3 rounded-xl text-sm hover:text-white hover:border-[#444] transition"
        >
          Start New Evaluation
        </button>
      </div>
    );
  }

  return (
    <div>
      {lastSessionId && !report && (
        <a
          href={`/advisor/report/${lastSessionId}`}
          className="flex items-center justify-between bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 mb-5 hover:border-[#E8A838]/40 transition group"
        >
          <div>
            <p className="text-[#555] text-xs">Previous report available</p>
            <p className="text-[#888] text-xs mt-0.5 group-hover:text-[#E8A838] transition">View your last advisor report →</p>
          </div>
          <span className="text-[#333] text-lg group-hover:text-[#E8A838] transition">↗</span>
        </a>
      )}

      {showPayment && (
        <PaymentModal
          description="Startup Viability Report"
          founderName={intake.founderName}
          founderEmail={profileEmail}
          founderPhone={profilePhone}
          receipt={`adv-${Date.now().toString(36)}`}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}

      {/* Section progress */}
      <div className="flex gap-1 mb-6">
        {SECTIONS.map((s, i) => (
          <div
            key={s.id}
            className={`flex-1 h-1 rounded-full transition-all ${
              i < section ? "bg-[#E8A838]" : i === section ? "bg-[#E8A838]/60" : "bg-[#222]"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-[#E8A838] uppercase tracking-widest mb-1">
        Section {SECTIONS[section].id}
      </p>
      <h2 className="font-crimson text-xl text-white mb-5">{SECTIONS[section].label}</h2>

      {/* Section A */}
      {section === 0 && (
        <div className="space-y-4">
          <Field label="Your Name" required>
            <input className={INPUT} placeholder="e.g., Arjun Sharma" value={intake.founderName ?? ""} onChange={set("founderName")} />
          </Field>
          <Field label="City / Country" required>
            <input className={INPUT} placeholder="e.g., Bangalore, India" value={intake.location ?? ""} onChange={set("location")} />
          </Field>
          <Field label="Age">
            <input className={INPUT} placeholder="e.g., 27" value={intake.age ?? ""} onChange={set("age")} />
          </Field>
          <Field label="Education">
            <input className={INPUT} placeholder="e.g., B.Tech Computer Science, IIT Madras" value={intake.education ?? ""} onChange={set("education")} />
          </Field>
          <Field label="Work Experience">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., 3 years as product manager at fintech startup" value={intake.workExperience ?? ""} onChange={set("workExperience")} />
          </Field>
          <Field label="Previous Startups">
            <textarea className={TEXTAREA} rows={2} placeholder="e.g., Built and shut down an edtech app in 2022. Learned about unit economics the hard way." value={intake.previousStartups ?? ""} onChange={set("previousStartups")} />
          </Field>
          <Field label="Relevant Skills for This Startup" required>
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Full-stack development, UX design, B2B sales, 5 years in supply chain industry" value={intake.relevantSkills ?? ""} onChange={set("relevantSkills")} />
          </Field>
        </div>
      )}

      {/* Section B */}
      {section === 1 && (
        <div className="space-y-4">
          <Field label="Describe the Problem You're Solving" required>
            <textarea className={TEXTAREA} rows={4} placeholder="e.g., Small kirana stores in India can't track inventory — they lose 15–20% of revenue from stockouts and spoilage because they manage everything on paper." value={intake.problemStatement ?? ""} onChange={set("problemStatement")} />
          </Field>
          <Field label="Who is Your Target Customer?" required>
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Kirana store owners in Tier 2-3 cities, running 1-2 stores, monthly revenue ₹3–10L, smartphone users but not tech-savvy." value={intake.targetCustomer ?? ""} onChange={set("targetCustomer")} />
          </Field>
          <Field label="How Big is the Market? (TAM/SAM/SOM or your estimate)">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., ~12M kirana stores in India. We're targeting the 2M in Maharashtra and Gujarat first. ~₹500Cr addressable in Year 1." value={intake.marketSize ?? ""} onChange={set("marketSize")} />
          </Field>
          <Field label="How Are People Solving This Problem Today?" required>
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Paper ledgers, WhatsApp groups, basic Excel. Some use Vyapar or Khatabook for accounting but not inventory." value={intake.existingSolutions ?? ""} onChange={set("existingSolutions")} />
          </Field>
          <Field label="How Often Do Customers Experience This Problem?" required>
            <input className={INPUT} placeholder="e.g., Daily — every time they need to restock or check what's available." value={intake.problemFrequency ?? ""} onChange={set("problemFrequency")} />
          </Field>
        </div>
      )}

      {/* Section C */}
      {section === 2 && (
        <div className="space-y-4">
          <Field label="Describe Your Solution" required>
            <textarea className={TEXTAREA} rows={4} placeholder="e.g., A WhatsApp-native inventory management system. Store owners message a bot to record sales and purchases. The app tracks stock levels and auto-sends reorder alerts." value={intake.solution ?? ""} onChange={set("solution")} />
          </Field>
          <Field label="What Makes You Different? (Your Unique Advantage)" required>
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., WhatsApp-native means zero app download friction. Works on 2G. Vernacular language support. No training needed — if you can text, you can use it." value={intake.uniqueAdvantage ?? ""} onChange={set("uniqueAdvantage")} />
          </Field>
          <Field label="What Tech or Infrastructure Does This Require?">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., WhatsApp Business API, a Node.js backend, cloud storage. We've already built it." value={intake.techRequirements ?? ""} onChange={set("techRequirements")} />
          </Field>
          <Field label="Current Prototype / MVP Status">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., MVP live with 8 stores. Running for 2 months. Processing ~50 inventory updates/day." value={intake.prototype ?? ""} onChange={set("prototype")} />
          </Field>
        </div>
      )}

      {/* Section D */}
      {section === 3 && (
        <div className="space-y-4">
          <Field label="How Will You Make Money?" required>
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., ₹299/month SaaS subscription per store. Annual plan at ₹2,499. Will add supplier commission model in Year 2." value={intake.revenueModel ?? ""} onChange={set("revenueModel")} />
          </Field>
          <Field label="Pricing Strategy">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Free for first 3 months. Then ₹299/month. Based on interviews — 7/10 stores said they'd pay ₹200–400/month if it saves 2+ hours/week." value={intake.pricingStrategy ?? ""} onChange={set("pricingStrategy")} />
          </Field>
          <Field label="How Will You Acquire Customers?">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., FMCG distributors as channel partners — they already visit every store weekly. Plus WhatsApp referral campaigns." value={intake.customerAcquisition ?? ""} onChange={set("customerAcquisition")} />
          </Field>
          <Field label="Unit Economics (CAC, LTV, Margins if known)">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., CAC through distributors ~₹150/store. LTV ~₹3,600 (12 months). Gross margin ~80% (SaaS). Payback period: 7 months." value={intake.unitEconomics ?? ""} onChange={set("unitEconomics")} />
          </Field>
        </div>
      )}

      {/* Section E */}
      {section === 4 && (
        <div className="space-y-4">
          <Field label="Current Traction (Users, Revenue, Pilots)">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., 8 paying stores. ₹2,400/month MRR. 0% churn in 2 months. NPS: 8/10 from informal survey." value={intake.currentTraction ?? ""} onChange={set("currentTraction")} />
          </Field>
          <Field label="Customer Interviews Done">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Interviewed 35 kirana owners. 28 said inventory tracking is their #1 pain. 12 agreed to pilot." value={intake.customerInterviews ?? ""} onChange={set("customerInterviews")} />
          </Field>
          <Field label="Monthly Revenue">
            <input className={INPUT} placeholder="e.g., ₹2,400/month (8 paying customers at ₹299)" value={intake.revenue ?? ""} onChange={set("revenue")} />
          </Field>
          <Field label="Waitlist or Pre-signups">
            <input className={INPUT} placeholder="e.g., 42 stores on waitlist from two distributor pilots" value={intake.waitlist ?? ""} onChange={set("waitlist")} />
          </Field>
        </div>
      )}

      {/* Section F */}
      {section === 5 && (
        <div className="space-y-4">
          <Field label="Team Size" required>
            <select className={INPUT} value={intake.teamSize ?? ""} onChange={set("teamSize")}>
              <option value="">Select…</option>
              <option value="Solo founder">Solo founder</option>
              <option value="2 people">2 people</option>
              <option value="3-5 people">3–5 people</option>
              <option value="6-10 people">6–10 people</option>
              <option value="10+ people">10+ people</option>
            </select>
          </Field>
          <Field label="Co-founders (names, backgrounds, equity split)">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Priya (CTO) — 5 years at Infosys, full-stack. 40/60 equity split. Full-time from Day 1." value={intake.coFounders ?? ""} onChange={set("coFounders")} />
          </Field>
          <Field label="Key Roles Filled vs. Missing">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Covered: Tech, product. Missing: Sales (hiring), Finance (advisor only for now)." value={intake.keyRoles ?? ""} onChange={set("keyRoles")} />
          </Field>
          <Field label="Advisors or Mentors">
            <textarea className={TEXTAREA} rows={2} placeholder="e.g., Rajan Mehta (ex-Reliance Retail, 20 years). Informal advisor." value={intake.advisors ?? ""} onChange={set("advisors")} />
          </Field>
        </div>
      )}

      {/* Section G */}
      {section === 6 && (
        <div className="space-y-4">
          <Field label="Time Commitment" required>
            <select className={INPUT} value={intake.timeCommitment ?? ""} onChange={set("timeCommitment")}>
              <option value="">Select…</option>
              <option value="Full-time (40+ hrs/week)">Full-time (40+ hrs/week)</option>
              <option value="Near full-time (30-40 hrs/week)">Near full-time (30–40 hrs/week)</option>
              <option value="Part-time (15-30 hrs/week)">Part-time (15–30 hrs/week)</option>
              <option value="Evenings/weekends only">Evenings/weekends only</option>
            </select>
          </Field>
          <Field label="Financial Runway (months you can sustain without income)">
            <input className={INPUT} placeholder="e.g., 8 months personal savings. Looking to raise ₹50L seed." value={intake.runway ?? ""} onChange={set("runway")} />
          </Field>
          <Field label="What's Your Biggest Fear About This Startup?">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., That kirana owners won't pay for software, even if they love it. And that a larger player will clone us in 6 months." value={intake.biggestFear ?? ""} onChange={set("biggestFear")} />
          </Field>
          <Field label="Why Are You Building This? What Drives You?" required>
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., My family runs a kirana store. I watched my father lose ₹50K to spoilage every year because he didn't know what was moving and what wasn't." value={intake.motivationSource ?? ""} onChange={set("motivationSource")} />
          </Field>
          <Field label="How Do You Handle Stress and Setbacks?">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., I go for a 30-min run every morning regardless. I've failed before (my first startup in 2020) and I know how to separate the idea from my identity now." value={intake.stressHandling ?? ""} onChange={set("stressHandling")} />
          </Field>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 mt-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        {section > 0 && (
          <button
            onClick={() => setSection((s) => s - 1)}
            className="px-4 py-2.5 rounded-lg text-sm border border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#444] transition"
          >
            ← Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex-1 bg-[#E8A838] text-black font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-[#d4962e] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {section === SECTIONS.length - 1 ? "Pay ₹999 & Get Report →" : "Next →"}
        </button>
      </div>

      {section === SECTIONS.length - 1 && (
        <p className="text-center text-xs text-[#444] mt-3">
          One-time payment · Your answers are saved in this browser session
        </p>
      )}
    </div>
  );
}
