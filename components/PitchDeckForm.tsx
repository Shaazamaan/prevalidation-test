"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import PaymentModal, { type PaymentResult } from "@/components/PaymentModal";
import ProgressMessages from "@/components/ProgressMessages";
import { downloadReceipt } from "@/lib/receipt";

const PROFILE_KEY = "dbk_profile";
function loadProfile(): { name?: string; email?: string; phone?: string; countryCode?: string } {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "{}"); } catch { return {}; }
}

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

export default function PitchDeckForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState("");
  const [fileError, setFileError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ name?: string; email?: string; phone?: string; country?: string }>({});
  const [toolPrice, setToolPrice] = useState("₹999");

  useEffect(() => {
    fetch("/api/payment/price?tool=pitchdeck")
      .then((r) => r.json())
      .then((d: { display?: string }) => { if (d.display) setToolPrice(d.display); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const p = loadProfile();
    setProfile({
      name: p.name,
      email: p.email,
      phone: p.phone ? `${p.countryCode ?? ""} ${p.phone}`.trim() : undefined,
    });
    const last = localStorage.getItem("dbk_last_pitchdeck");
    if (last) setLastSessionId(last);
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
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/pitch-deck/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64,
          mimeType: file.type,
          context: context.trim() || undefined,
          payment,
          founderName: profile.name,
          founderEmail: profile.email,
          founderPhone: profile.phone,
          founderCountry: profile.country,
        }),
      });

      const data = await res.json() as { report?: Record<string, unknown>; sessionId?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Evaluation failed. Please try again.");
        setLoading(false);
        return;
      }

      if (data.sessionId) {
        localStorage.setItem("dbk_last_pitchdeck", data.sessionId);
        const isFree = payment.orderId.startsWith("FREE_");
        downloadReceipt({
          orderId: payment.orderId,
          paymentId: payment.paymentId,
          founderName: profile.name,
          tool: "Pitch Deck Validator",
          reportUrl: window.location.origin + "/pitch-deck/report/" + data.sessionId,
          amount: payment.amount,
          date: new Date(),
        });
        router.push("/pitch-deck/report/" + data.sessionId);
      }
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return <ProgressMessages tool="pitchdeck" />;
  }

  return (
    <div className="space-y-5">
      {lastSessionId && (
        <a
          href={`/pitch-deck/report/${lastSessionId}`}
          className="flex items-center justify-between bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 hover:border-[#E8A838]/40 transition group"
        >
          <div>
            <p className="text-[#555] text-xs">Previous report available</p>
            <p className="text-[#888] text-xs mt-0.5 group-hover:text-[#E8A838] transition">View your last pitch deck report →</p>
          </div>
          <span className="text-[#333] text-lg group-hover:text-[#E8A838] transition">↗</span>
        </a>
      )}

      {showPayment && (
        <PaymentModal
          description="Pitch Deck Evaluation Report"
          founderName={profile.name}
          founderEmail={profile.email}
          founderPhone={profile.phone}
          receipt={`ptch-${Date.now().toString(36)}`}
          tool="pitchdeck"
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}

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

      <div>
        <label className="text-xs text-[#888] uppercase tracking-wide mb-2 block">
          Additional Context (Optional)
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={4}
          placeholder="e.g., Stage: Pre-seed. Industry: B2B SaaS in India. Seeking ₹2Cr seed round…"
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
        Pay {toolPrice} & Analyze Deck →
      </button>

      <p className="text-center text-xs text-[#444]">
        Claude AI analyzes every slide · DB Score + GR Score · 23-dimension report
      </p>
    </div>
  );
}
