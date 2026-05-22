"use client";
import { useState } from "react";

type TermExplanation = {
  term: string;
  plainEnglish: string;
  whyItMatters: string;
  founderWatch: string;
  negotiable: boolean;
};

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("rzp-sdk")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id = "rzp-sdk"; s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function TermSheet({ sessionEmail, isFree, price }: { sessionEmail: string; isFree: boolean; price: number }) {
  const [clause, setClause] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<TermExplanation[] | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const submit = async (payment?: { orderId: string; paymentId: string; signature: string }) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tools/term-sheet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clause, payment }) });
      const d = await res.json() as { result?: TermExplanation[]; error?: string };
      if (!res.ok) { if (res.status === 402) setShowPayment(true); else setError(d.error ?? "Something went wrong"); setLoading(false); return; }
      setResults(d.result!);
    } catch { setError("Network error."); }
    setLoading(false);
  };

  const handlePayment = async () => {
    setLoading(true); setError("");
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setError("Payment SDK failed to load"); setLoading(false); return; }
      const orderRes = await fetch("/api/payment/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receipt: `ts_${Date.now()}`, tool: "readiness" }) });
      if (!orderRes.ok) { setError("Failed to create order"); setLoading(false); return; }
      const { orderId, amount } = await orderRes.json() as { orderId: string; amount: number };
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount, currency: "INR",
        name: "Devbridge", description: "Term Sheet Explainer — AI Tool", order_id: orderId,
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setShowPayment(false); await submit({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
        },
        prefill: { email: sessionEmail }, theme: { color: "#E8A838" },
        modal: { ondismiss: () => { setLoading(false); setShowPayment(false); } },
      });
      rzp.open();
    } catch { setError("Payment error."); setLoading(false); }
  };

  const EXAMPLES = ["Liquidation preference 1x non-participating", "Anti-dilution: broad-based weighted average", "Pro-rata rights", "Drag-along provision", "Vesting: 4-year with 1-year cliff"];

  if (results) return (
    <div className="space-y-4">
      {results.map((r, i) => (
        <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-white font-semibold">{r.term}</h3>
            <span className={`text-[9px] px-2 py-0.5 rounded-full border shrink-0 ${r.negotiable ? "text-green-400 border-green-800/40" : "text-[#555] border-[#333]"}`}>{r.negotiable ? "Negotiable" : "Standard"}</span>
          </div>
          <div className="space-y-3">
            <div><p className="text-[#555] text-xs uppercase tracking-wider mb-1">Plain English</p><p className="text-[#ccc] text-sm">{r.plainEnglish}</p></div>
            <div><p className="text-[#555] text-xs uppercase tracking-wider mb-1">Why it matters</p><p className="text-[#ccc] text-sm">{r.whyItMatters}</p></div>
            <div><p className="text-red-400 text-xs uppercase tracking-wider mb-1">Watch out for</p><p className="text-red-300 text-sm">{r.founderWatch}</p></div>
          </div>
        </div>
      ))}
      <button onClick={() => { setResults(null); setClause(""); }} className="w-full py-3 border border-[#1a1a1a] text-[#555] rounded-xl text-sm hover:border-[#333] hover:text-[#888] transition">Explain another clause</button>
    </div>
  );

  return (
    <>
      {showPayment && !isFree && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-crimson text-2xl text-white mb-1">Unlock Term Sheet Explainer</h2>
            <p className="text-[#666] text-sm mb-5">One-time payment · Delivered instantly.</p>
            <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-4 mb-5 flex items-center justify-between">
              <span className="text-[#888] text-sm">Term Sheet Explainer</span>
              <span className="text-[#E8A838] font-bold text-xl">₹{(price / 100).toLocaleString("en-IN")}</span>
            </div>
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setShowPayment(false); setLoading(false); }} className="flex-1 bg-[#1a1a1a] border border-[#333] text-[#666] py-3 rounded-xl text-sm">Cancel</button>
              <button onClick={handlePayment} disabled={loading} className="flex-1 bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm disabled:opacity-50">{loading ? "Opening…" : `Pay ₹${(price / 100).toLocaleString("en-IN")}`}</button>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); if (!clause.trim()) { setError("Paste a term sheet clause"); return; } isFree ? submit() : setShowPayment(true); }} className="space-y-4">
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Paste your term sheet clause</label>
          <textarea value={clause} onChange={(e) => setClause(e.target.value)} placeholder="Paste any term sheet clause or multiple clauses here..." rows={6} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition resize-none font-mono" />
        </div>
        <div>
          <p className="text-[#444] text-xs mb-2">Or try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => setClause(ex)} className="text-[10px] px-2 py-1 bg-[#1a1a1a] border border-[#333] text-[#666] rounded-lg hover:border-[#555] hover:text-[#888] transition">{ex}</button>
            ))}
          </div>
        </div>
        {error && <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2"><p className="text-red-400 text-xs">{error}</p></div>}
        <button type="submit" disabled={loading} className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-50">
          {loading ? "Explaining clauses…" : isFree ? "Explain in Plain English →" : `Explain · ₹${(price / 100).toLocaleString("en-IN")}`}
        </button>
      </form>
    </>
  );
}
