"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91 India" },
  { code: "+1", label: "🇺🇸 +1 USA/Canada" },
  { code: "+44", label: "🇬🇧 +44 UK" },
  { code: "+61", label: "🇦🇺 +61 Australia" },
  { code: "+65", label: "🇸🇬 +65 Singapore" },
  { code: "+971", label: "🇦🇪 +971 UAE" },
  { code: "+60", label: "🇲🇾 +60 Malaysia" },
  { code: "+49", label: "🇩🇪 +49 Germany" },
  { code: "+33", label: "🇫🇷 +33 France" },
  { code: "+81", label: "🇯🇵 +81 Japan" },
  { code: "+86", label: "🇨🇳 +86 China" },
  { code: "+55", label: "🇧🇷 +55 Brazil" },
  { code: "+27", label: "🇿🇦 +27 South Africa" },
  { code: "+234", label: "🇳🇬 +234 Nigeria" },
  { code: "+254", label: "🇰🇪 +254 Kenya" },
  { code: "+92", label: "🇵🇰 +92 Pakistan" },
  { code: "+880", label: "🇧🇩 +880 Bangladesh" },
  { code: "+94", label: "🇱🇰 +94 Sri Lanka" },
  { code: "+977", label: "🇳🇵 +977 Nepal" },
  { code: "+other", label: "Other" },
];

const STARTUP_TYPES = [
  "SaaS / Software / Tech",
  "E-commerce / Physical Product",
  "Marketplace / Platform",
  "Service / Agency / Consulting",
  "Food / Beverage / FMCG",
  "Health / Medical / Wellness",
  "Fintech / Finance / Insurance",
  "Education / EdTech",
  "Other",
];

type Profile = {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  country: string;
};

const PROFILE_KEY = "dbk_profile";

function saveProfile(profile: Profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
}

const INPUT = "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition";

export default function LandingForm() {
  const router = useRouter();
  const [step, setStep] = useState<"profile" | "tools" | "readiness">("profile");
  const [profile, setProfile] = useState<Profile>({
    name: "", email: "", countryCode: "+91", phone: "", country: "",
  });
  const [idea, setIdea] = useState("");
  const [startupType, setStartupType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const profileValid =
    profile.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) &&
    profile.phone.trim().length >= 6 &&
    profile.country.trim().length >= 2;

  const handleProfileNext = () => {
    saveProfile(profile);
    setStep("tools");
  };

  const handleToolSelect = (tool: "advisor" | "pitch-deck") => {
    saveProfile(profile);
    router.push(`/${tool}`);
  };

  const handleStartReadiness = async () => {
    if (!idea.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          founderName: profile.name.trim(),
          email: profile.email.trim(),
          phone: `${profile.countryCode} ${profile.phone.trim()}`,
          country: profile.country.trim(),
          startupIdea: idea.trim(),
          startupType: startupType || "Not specified",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      const { sessionId } = await res.json();
      router.push(`/chat/${sessionId}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (step === "profile") {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">Full Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            placeholder="Your full name"
            className={INPUT}
          />
        </div>

        <div>
          <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">Email Address <span className="text-red-500">*</span></label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            placeholder="you@example.com"
            className={INPUT}
          />
        </div>

        <div>
          <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">Phone Number <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <select
              value={profile.countryCode}
              onChange={(e) => setProfile((p) => ({ ...p, countryCode: e.target.value }))}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-2.5 text-white text-sm focus:outline-none focus:border-[#E8A838] transition w-36 shrink-0"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))}
              placeholder="Phone number"
              className={INPUT}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">Country <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={profile.country}
            onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
            placeholder="e.g., India, UAE, UK"
            className={INPUT}
          />
        </div>

        <button
          onClick={handleProfileNext}
          disabled={!profileValid}
          className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-lg text-sm hover:bg-[#d4962e] transition disabled:opacity-40 disabled:cursor-not-allowed mt-2"
        >
          Continue →
        </button>
        <p className="text-center text-xs text-[#444]">Your details are stored securely and never shared.</p>
      </div>
    );
  }

  if (step === "tools") {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-white text-sm mb-1">Welcome, <span className="text-[#E8A838] font-semibold">{profile.name.split(" ")[0]}</span></p>
          <p className="text-[#666] text-xs">Choose what you'd like to evaluate today.</p>
        </div>

        {/* Tool 1 — Readiness Check */}
        <button
          onClick={() => setStep("readiness")}
          className="w-full text-left bg-[#0d0d0d] border border-[#222] hover:border-[#E8A838]/60 rounded-xl p-4 transition group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white font-semibold text-sm group-hover:text-[#E8A838] transition">Founder Readiness Check</p>
              <p className="text-[#555] text-xs mt-1">70 questions · 14 dimensions · 25–35 min</p>
            </div>
            <span className="text-[#333] group-hover:text-[#E8A838] transition text-sm mt-0.5">→</span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 bg-[#111] border border-[#222] rounded text-[#555]">Readiness interrogation</span>
            <span className="text-xs px-2 py-0.5 bg-[#111] border border-[#222] rounded text-[#555]">₹999</span>
          </div>
        </button>

        {/* Tool 2 — Advisor */}
        <button
          onClick={() => handleToolSelect("advisor")}
          className="w-full text-left bg-[#0d0d0d] border border-[#222] hover:border-[#E8A838]/60 rounded-xl p-4 transition group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white font-semibold text-sm group-hover:text-[#E8A838] transition">Startup Viability Advisor</p>
              <p className="text-[#555] text-xs mt-1">7-section intake · 6 pathways · 10–15 min</p>
            </div>
            <span className="text-[#333] group-hover:text-[#E8A838] transition text-sm mt-0.5">→</span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 bg-[#111] border border-[#222] rounded text-[#555]">Geography-aware</span>
            <span className="text-xs px-2 py-0.5 bg-[#111] border border-[#222] rounded text-[#555]">₹999</span>
          </div>
        </button>

        {/* Tool 3 — Pitch Deck */}
        <button
          onClick={() => handleToolSelect("pitch-deck")}
          className="w-full text-left bg-[#0d0d0d] border border-[#222] hover:border-[#E8A838]/60 rounded-xl p-4 transition group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white font-semibold text-sm group-hover:text-[#E8A838] transition">Pitch Deck Validator</p>
              <p className="text-[#555] text-xs mt-1">Upload PDF · DB Score + GR Score · 23 dimensions</p>
            </div>
            <span className="text-[#333] group-hover:text-[#E8A838] transition text-sm mt-0.5">→</span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 bg-[#111] border border-[#222] rounded text-[#555]">Investment + Grant</span>
            <span className="text-xs px-2 py-0.5 bg-[#111] border border-[#222] rounded text-[#555]">₹999</span>
          </div>
        </button>

        <button
          onClick={() => setStep("profile")}
          className="w-full text-[#444] text-xs hover:text-[#666] transition py-1"
        >
          ← Edit my details
        </button>
      </div>
    );
  }

  // step === "readiness"
  return (
    <div className="space-y-4">
      <button
        onClick={() => setStep("tools")}
        className="text-[#555] text-xs hover:text-[#888] transition"
      >
        ← Back
      </button>

      <div>
        <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-1">Founder Readiness Check</p>
        <p className="text-white text-sm">Tell us about your startup idea.</p>
      </div>

      <div>
        <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">Startup Type</label>
        <select
          value={startupType}
          onChange={(e) => setStartupType(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A838] transition"
          style={{ color: startupType ? "white" : "#666" }}
        >
          <option value="" disabled>Select category…</option>
          {STARTUP_TYPES.map((t) => (
            <option key={t} value={t} style={{ color: "white" }}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">
          Your Startup Idea <span className="text-red-500">*</span>
        </label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value.slice(0, 500))}
          placeholder="What problem does it solve, and for whom? Be specific."
          required
          rows={4}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition resize-none"
        />
        <p className="text-right text-xs text-[#555] mt-1">{idea.length}/500</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleStartReadiness}
        disabled={loading || !idea.trim()}
        className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-lg text-sm hover:bg-[#d4962e] transition disabled:opacity-40"
      >
        {loading ? "Starting…" : "Begin the Interrogation →"}
      </button>
      <p className="text-center text-xs text-[#444]">
        70 questions · 25–35 min · Payment of ₹999 required at the end to generate your report
      </p>
    </div>
  );
}
