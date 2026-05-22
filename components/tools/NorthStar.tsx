"use client";
import { useState } from "react";

type NorthStarResult = {
  metric: string;
  definition: string;
  whyThisOne: string;
  howToMeasure: string;
  currentBaseline: string;
  target6Months: string;
  leadingIndicators: string[];
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

export default function NorthStar({ sessionEmail, isFree, price }: { sessionEmail: string; isFree: boolean; price: number }) {
  const [form, setForm] = useState({ idea: "", stage: "idea", businessModel: "saas" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<NorthStarResult | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const submit = async (payment?: { orderId: string; paymentId: string; signature: string }) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tools/north-star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, payment }),
      });
      const d = await res.json() as { result?: NorthStarResult; error?: string };
      if (!res.ok) { if (res.status === 402) setShowPayment(true); else setError(d.error ?? "Something went wrong"); setLoading(false); return; }
      setResult(d.result!);
    } catch { setError("Network error. Please try again."); }
    setLoading(false);
  };

  const handlePayment = async () => {
    setLoading(true); setError("");
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setError("Payment SDK failed to load"); setLoading(false); return; }
      const orderRes = await fetch("/api/payment/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receipt: `ns_${Date.now()}`, tool: "readiness" }) });
      if (!orderRes.ok) { setError("Failed to create order"); setLoading(false); return; }
      const { orderId, amount } = await orderRes.json() as { orderId: string; amount: number };
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "", amount, currency: "INR",
        name: "Devbridge", description: "North Star Metric — AI Tool", order_id: orderId,
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setShowPayment(false); await submit({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
        },
        prefill: { email: sessionEmail }, theme: { color: "#E8A838" },
        modal: { ondismiss: () => { setLoading(false); setShowPayment(false); } },
      });
      rzp.open();
    } catch { setError("Payment error. Please try again."); setLoading(false); }
  };

  if (result) return (
    <div>
      <div className="mb-6 p-5 bg-[#E8A838]/10 border border-[#E8A838]/30 rounded-xl text-center">
        <p className="text-[#E8A838] text-xs uppercase tracking-wider mb-2">Your North Star Metric</p>
        <h2 className="text-white text-2xl font-bold mb-1">{result.metric}</h2>
        <p className="text-[#888] text-sm">{result.definition}</p>
      </div>
      <div className="space-y-4">
        {[
          { label: "Why this metric", value: result.whyThisOne },
          { label: "How to measure", value: result.howToMeasure },
          { label: "Current baseline", value: result.currentBaseline },
          { label: "6-month target", value: result.target6Months },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
            <p className="text-[#555] text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className="text-[#ccc] text-sm">{value}</p>
          </div>
        ))}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-[#555] text-xs uppercase tracking-wider mb-2">Leading Indicators</p>
          <ul className="space-y-1">{result.leadingIndicators.map((li, i) => <li key={i} className="text-[#ccc] text-sm flex gap-2"><span className="text-[#E8A838]">→</span>{li}</li>)}</ul>
        </div>
      </div>
      <button onClick={() => setResult(null)} className="mt-6 w-full py-3 border border-[#1a1a1a] text-[#555] rounded-xl text-sm hover:border-[#333] hover:text-[#888] transition">Start over</button>
    </div>
  );

  return (
    <>
      {showPayment && !isFree && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-crimson text-2xl text-white mb-1">Unlock North Star Metric</h2>
            <p className="text-[#666] text-sm mb-5">One-time payment · Results delivered instantly.</p>
            <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-4 mb-5 flex items-center justify-between">
              <span className="text-[#888] text-sm">North Star Metric</span>
              <span className="text-[#E8A838] font-bold text-xl">₹{(price / 100).toLocaleString("en-IN")}</span>
            </div>
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setShowPayment(false); setLoading(false); }} className="flex-1 bg-[#1a1a1a] border border-[#333] text-[#666] py-3 rounded-xl text-sm hover:text-white transition">Cancel</button>
              <button onClick={handlePayment} disabled={loading} className="flex-1 bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-50">{loading ? "Opening…" : `Pay ₹${(price / 100).toLocaleString("en-IN")}`}</button>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); if (!form.idea.trim()) { setError("Describe your startup"); return; } isFree ? submit() : setShowPayment(true); }} className="space-y-4">
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Describe your startup</label>
          <textarea value={form.idea} onChange={(e) => setForm({ ...form, idea: e.target.value })} placeholder="What does your startup do and who does it serve?" rows={4} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Stage</label>
            <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#E8A838] transition">
              {["idea", "pre-revenue", "early-revenue", "growth"].map(s => <option key={s} value={s}>{s.replace("-", " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Business model</label>
            <select value={form.businessModel} onChange={(e) => setForm({ ...form, businessModel: e.target.value })} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#E8A838] transition">
              {["saas", "marketplace", "ecommerce", "service", "hardware", "community"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        {error && <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2"><p className="text-red-400 text-xs">{error}</p></div>}
        <button type="submit" disabled={loading} className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-50">
          {loading ? "Defining your north star…" : isFree ? "Define North Star →" : `Generate · ₹${(price / 100).toLocaleString("en-IN")}`}
        </button>
      </form>
    </>
  );
}
