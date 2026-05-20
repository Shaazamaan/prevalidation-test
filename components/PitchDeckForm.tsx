"use client";

import { useState, useRef, useEffect } from "react";
import PaymentModal, { type PaymentResult } from "@/components/PaymentModal";

const PROFILE_KEY = "dbk_profile";
function loadProfile(): { name?: string; email?: string; phone?: string; countryCode?: string } {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "{}"); } catch { return {}; }
}

type PitchDeckReport = Record<string, unknown> & {
  track: string;
  trackLabel: string;
  dbScore: number;
  grScore: number;
  overallVerdict: string;
  grantVerdict: string;
  executiveSummary: string;
  investmentDimensions: { dimension: string; score: number; assessment: string; gap: string; fix: string }[];
  grantDimensions: { dimension: string; score: number; assessment: string; fix: string }[];
  topStrengths: { strength: string; evidence: string }[];
  criticalWeaknesses: { weakness: string; impact: string; fix: string }[];
  missingSlides: string[];
  investorReadiness: { readyFor: string[]; notReadyFor: string[]; timeline: string };
  suggestedGrantTypes: { grantType: string; rationale: string; examples: string }[];
  nextSteps: { action: string; priority: string; timeline: string }[];
  finalMessage: string;
};

const VERDICT_STYLE: Record<string, string> = {
  "FUNDABLE": "text-green-400 border-green-800 bg-green-900/20",
  "CONDITIONALLY FUNDABLE": "text-amber-400 border-amber-800 bg-amber-900/20",
  "NOT FUNDABLE": "text-red-400 border-red-800 bg-red-900/20",
  "GRANT READY": "text-blue-400 border-blue-800 bg-blue-900/20",
  "CONDITIONALLY GRANT READY": "text-purple-400 border-purple-800 bg-purple-900/20",
  "NOT GRANT READY": "text-orange-400 border-orange-800 bg-orange-900/20",
};

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#222] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[#888] w-8 text-right">{score}/{max}</span>
    </div>
  );
}

export default function PitchDeckForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState("");
  const [fileError, setFileError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<PitchDeckReport | null>(null);
  const [profile, setProfile] = useState<{ name?: string; email?: string; phone?: string }>({});

  useEffect(() => {
    const p = loadProfile();
    setProfile({
      name: p.name,
      email: p.email,
      phone: p.phone ? `${p.countryCode ?? ""} ${p.phone}`.trim() : undefined,
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileError("");
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setFileError("Only PDF, JPG, PNG, or WebP files are accepted.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File must be under ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(f);
  };

  const handlePaymentSuccess = async (payment: PaymentResult) => {
    setShowPayment(false);
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const fileBase64 = btoa(binary);

      const res = await fetch("/api/pitch-deck/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64,
          mimeType: file.type,
          context: context.trim() || undefined,
          payment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Evaluation failed. Please try again.");
        setLoading(false);
        return;
      }

      setReport(data.report as PitchDeckReport);
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
        <p className="font-crimson text-2xl text-white mb-2">Analyzing your pitch deck…</p>
        <p className="text-[#666] text-sm">This takes 30–60 seconds. Don't close this tab.</p>
      </div>
    );
  }

  if (report) {
    const invStyle = VERDICT_STYLE[report.overallVerdict] ?? "";
    const grStyle = VERDICT_STYLE[report.grantVerdict] ?? "";
    return (
      <div className="space-y-6">
        {/* Track */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-4">
          <p className="text-xs text-[#555] uppercase mb-1">Track Classified</p>
          <p className="text-white font-semibold">{report.trackLabel}</p>
          <p className="text-[#555] text-xs">{report.track}</p>
        </div>

        {/* Verdicts + Scores */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`border rounded-xl p-4 ${invStyle}`}>
            <p className="text-xs uppercase mb-1 opacity-70">Investment</p>
            <p className="text-2xl font-bold">{report.dbScore}</p>
            <p className="text-xs opacity-70">DB Score /100</p>
            <p className="text-xs mt-2">{report.overallVerdict}</p>
          </div>
          <div className={`border rounded-xl p-4 ${grStyle}`}>
            <p className="text-xs uppercase mb-1 opacity-70">Grant</p>
            <p className="text-2xl font-bold">{report.grScore}</p>
            <p className="text-xs opacity-70">GR Score /100</p>
            <p className="text-xs mt-2">{report.grantVerdict}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-4">
          <p className="text-xs text-[#555] uppercase mb-2">Executive Summary</p>
          <p className="text-[#ccc] text-sm leading-relaxed">{report.executiveSummary}</p>
        </div>

        {/* Investment dimensions */}
        <div>
          <h3 className="text-white font-semibold mb-3">Investment Dimensions</h3>
          <div className="space-y-3">
            {report.investmentDimensions.map((d) => (
              <div key={d.dimension} className="bg-[#111] border border-[#222] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-white text-sm font-medium">{d.dimension}</p>
                </div>
                <ScoreBar score={d.score} />
                <p className="text-[#666] text-xs mt-2">{d.assessment}</p>
                {d.fix && <p className="text-[#E8A838] text-xs mt-1">→ {d.fix}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Grant dimensions */}
        <div>
          <h3 className="text-white font-semibold mb-3">Grant Dimensions</h3>
          <div className="space-y-3">
            {report.grantDimensions.map((d) => (
              <div key={d.dimension} className="bg-[#111] border border-[#222] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-white text-sm font-medium">{d.dimension}</p>
                </div>
                <ScoreBar score={d.score} />
                <p className="text-[#666] text-xs mt-2">{d.assessment}</p>
                {d.fix && <p className="text-blue-400 text-xs mt-1">→ {d.fix}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        {report.topStrengths.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3">Top Strengths</h3>
            {report.topStrengths.map((s, i) => (
              <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-3 mb-2">
                <p className="text-green-400 text-sm">{s.strength}</p>
                <p className="text-[#555] text-xs mt-1">{s.evidence}</p>
              </div>
            ))}
          </div>
        )}

        {/* Critical weaknesses */}
        {report.criticalWeaknesses.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3">Critical Weaknesses</h3>
            {report.criticalWeaknesses.map((w, i) => (
              <div key={i} className="bg-[#111] border border-red-900/30 rounded-lg p-3 mb-2">
                <p className="text-red-400 text-sm font-medium">{w.weakness}</p>
                <p className="text-[#666] text-xs mt-1">{w.impact}</p>
                <p className="text-[#E8A838] text-xs mt-1">→ {w.fix}</p>
              </div>
            ))}
          </div>
        )}

        {/* Missing slides */}
        {report.missingSlides.length > 0 && (
          <div className="bg-amber-900/10 border border-amber-800/30 rounded-xl p-4">
            <h3 className="text-amber-400 text-sm font-semibold mb-2">Missing Slides</h3>
            <ul className="space-y-1">
              {report.missingSlides.map((s, i) => (
                <li key={i} className="text-[#888] text-xs">▸ {s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Investor readiness */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Investor Readiness</h3>
          {report.investorReadiness.readyFor.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-green-400 uppercase mb-1">Ready For</p>
              {report.investorReadiness.readyFor.map((r, i) => <p key={i} className="text-[#888] text-xs">▸ {r}</p>)}
            </div>
          )}
          {report.investorReadiness.notReadyFor.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-red-400 uppercase mb-1">Not Yet Ready For</p>
              {report.investorReadiness.notReadyFor.map((r, i) => <p key={i} className="text-[#888] text-xs">▾ {r}</p>)}
            </div>
          )}
          <p className="text-[#E8A838] text-xs mt-2">{report.investorReadiness.timeline}</p>
        </div>

        {/* Grant suggestions */}
        {report.suggestedGrantTypes.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3">Suggested Grant Types</h3>
            {report.suggestedGrantTypes.map((g, i) => (
              <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-3 mb-2">
                <p className="text-blue-400 text-sm font-medium">{g.grantType}</p>
                <p className="text-[#666] text-xs mt-1">{g.rationale}</p>
                <p className="text-[#555] text-xs mt-1">{g.examples}</p>
              </div>
            ))}
          </div>
        )}

        {/* Next steps */}
        {report.nextSteps.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3">Next Steps</h3>
            {report.nextSteps.map((s, i) => (
              <div key={i} className="flex items-start gap-3 bg-[#111] border border-[#222] rounded-lg p-3 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded border shrink-0 mt-0.5 ${
                  s.priority === "CRITICAL" ? "border-red-800 text-red-400" :
                  s.priority === "HIGH" ? "border-amber-800 text-amber-400" : "border-[#333] text-[#666]"
                }`}>{s.priority}</span>
                <div>
                  <p className="text-white text-sm">{s.action}</p>
                  <p className="text-[#555] text-xs mt-1">{s.timeline}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Final message */}
        <div className="bg-[#E8A838]/10 border border-[#E8A838]/30 rounded-xl p-5">
          <p className="text-xs text-[#E8A838] uppercase tracking-wide mb-2">From Devbridge</p>
          <p className="text-[#ccc] text-sm leading-relaxed">{report.finalMessage}</p>
        </div>

        <button
          onClick={() => { setReport(null); setFile(null); setContext(""); }}
          className="w-full bg-[#111] border border-[#222] text-[#666] py-3 rounded-xl text-sm hover:text-white hover:border-[#444] transition"
        >
          Analyze Another Deck
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showPayment && (
        <PaymentModal
          description="Pitch Deck Evaluation Report"
          founderName={profile.name}
          founderEmail={profile.email}
          founderPhone={profile.phone}
          receipt={`ptch-${Date.now().toString(36)}`}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}

      {/* File upload */}
      <div>
        <label className="text-xs text-[#888] uppercase tracking-wide mb-2 block">
          Upload Pitch Deck <span className="text-red-500">*</span>
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
            file
              ? "border-[#E8A838]/50 bg-[#E8A838]/5"
              : "border-[#333] hover:border-[#555] bg-[#111]"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div>
              <p className="text-[#E8A838] font-medium text-sm">{file.name}</p>
              <p className="text-[#555] text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
            </div>
          ) : (
            <div>
              <p className="text-[#555] text-sm mb-1">Click to upload your pitch deck</p>
              <p className="text-[#444] text-xs">PDF, JPG, PNG, WebP · Max 10MB</p>
            </div>
          )}
        </div>
        {fileError && <p className="text-red-400 text-xs mt-1">{fileError}</p>}
      </div>

      {/* Optional context */}
      <div>
        <label className="text-xs text-[#888] uppercase tracking-wide mb-2 block">
          Additional Context (Optional)
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={4}
          placeholder="e.g., Stage: Pre-seed. Industry: B2B SaaS in India. Seeking ₹2Cr seed round. Previous deck was rejected by 3 angels — share what feedback you received…"
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={() => setShowPayment(true)}
        disabled={!file || !!fileError}
        className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Pay ₹999 & Analyze Deck →
      </button>

      <p className="text-center text-xs text-[#444]">
        Claude AI analyzes every slide · DB Score + GR Score · 23-dimension report
      </p>
    </div>
  );
}
