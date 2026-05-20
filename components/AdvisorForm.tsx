"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PaymentModal, { type PaymentResult } from "@/components/PaymentModal";
import ProgressMessages from "@/components/ProgressMessages";
import { downloadReceipt } from "@/lib/receipt";
import type { AdvisorIntake } from "@/lib/advisor-prompt";

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
  const router = useRouter();
  const [section, setSection] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [intake, setIntake] = useState<Partial<AdvisorIntake>>({});
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCountry, setProfileCountry] = useState("");

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

      const data = await res.json() as { report?: Record<string, unknown>; sessionId?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Evaluation failed. Please try again.");
        setLoading(false);
        return;
      }

      if (data.sessionId) {
        localStorage.setItem("dbk_last_advisor", data.sessionId);
        const isFree = payment.orderId.startsWith("FREE_");
        downloadReceipt({
          orderId: payment.orderId,
          paymentId: payment.paymentId,
          founderName: intake.founderName,
          tool: "Startup Viability Advisor",
          reportUrl: window.location.origin + "/advisor/report/" + data.sessionId,
          amount: isFree ? 0 : 99900,
          date: new Date(),
        });
        router.push("/advisor/report/" + data.sessionId);
      }
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return <ProgressMessages tool="advisor" />;
  }

  return (
    <div>
      {lastSessionId && (
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
            <textarea className={TEXTAREA} rows={2} placeholder="e.g., Built and shut down an edtech app in 2022." value={intake.previousStartups ?? ""} onChange={set("previousStartups")} />
          </Field>
          <Field label="Relevant Skills for This Startup" required>
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Full-stack development, UX design, B2B sales" value={intake.relevantSkills ?? ""} onChange={set("relevantSkills")} />
          </Field>
        </div>
      )}

      {section === 1 && (
        <div className="space-y-4">
          <Field label="Describe the Problem You're Solving" required>
            <textarea className={TEXTAREA} rows={4} placeholder="e.g., Small kirana stores in India can't track inventory…" value={intake.problemStatement ?? ""} onChange={set("problemStatement")} />
          </Field>
          <Field label="Who is Your Target Customer?" required>
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Kirana store owners in Tier 2-3 cities…" value={intake.targetCustomer ?? ""} onChange={set("targetCustomer")} />
          </Field>
          <Field label="How Big is the Market?">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., ~12M kirana stores in India…" value={intake.marketSize ?? ""} onChange={set("marketSize")} />
          </Field>
          <Field label="How Are People Solving This Problem Today?" required>
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Paper ledgers, WhatsApp groups, basic Excel…" value={intake.existingSolutions ?? ""} onChange={set("existingSolutions")} />
          </Field>
          <Field label="How Often Do Customers Experience This Problem?" required>
            <input className={INPUT} placeholder="e.g., Daily — every time they need to restock" value={intake.problemFrequency ?? ""} onChange={set("problemFrequency")} />
          </Field>
        </div>
      )}

      {section === 2 && (
        <div className="space-y-4">
          <Field label="Describe Your Solution" required>
            <textarea className={TEXTAREA} rows={4} placeholder="e.g., A WhatsApp-native inventory management system…" value={intake.solution ?? ""} onChange={set("solution")} />
          </Field>
          <Field label="What Makes You Different?" required>
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., WhatsApp-native means zero app download friction…" value={intake.uniqueAdvantage ?? ""} onChange={set("uniqueAdvantage")} />
          </Field>
          <Field label="Tech or Infrastructure Required">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., WhatsApp Business API, Node.js backend…" value={intake.techRequirements ?? ""} onChange={set("techRequirements")} />
          </Field>
          <Field label="Current Prototype / MVP Status">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., MVP live with 8 stores…" value={intake.prototype ?? ""} onChange={set("prototype")} />
          </Field>
        </div>
      )}

      {section === 3 && (
        <div className="space-y-4">
          <Field label="How Will You Make Money?" required>
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., ₹299/month SaaS subscription per store…" value={intake.revenueModel ?? ""} onChange={set("revenueModel")} />
          </Field>
          <Field label="Pricing Strategy">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Free for first 3 months. Then ₹299/month…" value={intake.pricingStrategy ?? ""} onChange={set("pricingStrategy")} />
          </Field>
          <Field label="How Will You Acquire Customers?">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., FMCG distributors as channel partners…" value={intake.customerAcquisition ?? ""} onChange={set("customerAcquisition")} />
          </Field>
          <Field label="Unit Economics">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., CAC ~₹150, LTV ~₹3,600, Gross margin ~80%…" value={intake.unitEconomics ?? ""} onChange={set("unitEconomics")} />
          </Field>
        </div>
      )}

      {section === 4 && (
        <div className="space-y-4">
          <Field label="Current Traction">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., 8 paying stores, ₹2,400/month MRR…" value={intake.currentTraction ?? ""} onChange={set("currentTraction")} />
          </Field>
          <Field label="Customer Interviews Done">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Interviewed 35 kirana owners…" value={intake.customerInterviews ?? ""} onChange={set("customerInterviews")} />
          </Field>
          <Field label="Monthly Revenue">
            <input className={INPUT} placeholder="e.g., ₹2,400/month (8 paying customers)" value={intake.revenue ?? ""} onChange={set("revenue")} />
          </Field>
          <Field label="Waitlist or Pre-signups">
            <input className={INPUT} placeholder="e.g., 42 stores on waitlist" value={intake.waitlist ?? ""} onChange={set("waitlist")} />
          </Field>
        </div>
      )}

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
          <Field label="Co-founders">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Priya (CTO) — 5 years at Infosys, full-stack…" value={intake.coFounders ?? ""} onChange={set("coFounders")} />
          </Field>
          <Field label="Key Roles Filled vs. Missing">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., Covered: Tech, product. Missing: Sales…" value={intake.keyRoles ?? ""} onChange={set("keyRoles")} />
          </Field>
          <Field label="Advisors or Mentors">
            <textarea className={TEXTAREA} rows={2} placeholder="e.g., Rajan Mehta (ex-Reliance Retail)…" value={intake.advisors ?? ""} onChange={set("advisors")} />
          </Field>
        </div>
      )}

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
          <Field label="Financial Runway">
            <input className={INPUT} placeholder="e.g., 8 months personal savings. Looking to raise ₹50L seed." value={intake.runway ?? ""} onChange={set("runway")} />
          </Field>
          <Field label="Biggest Fear About This Startup">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., That kirana owners won't pay for software…" value={intake.biggestFear ?? ""} onChange={set("biggestFear")} />
          </Field>
          <Field label="Why Are You Building This?" required>
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., My family runs a kirana store…" value={intake.motivationSource ?? ""} onChange={set("motivationSource")} />
          </Field>
          <Field label="How Do You Handle Stress and Setbacks?">
            <textarea className={TEXTAREA} rows={3} placeholder="e.g., I go for a 30-min run every morning…" value={intake.stressHandling ?? ""} onChange={set("stressHandling")} />
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
