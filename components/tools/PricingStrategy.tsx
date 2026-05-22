"use client";
import { useState } from "react";

type PricingResult = {
  recommendedModel: string;
  reasoning: string;
  tiers: { name: string; price: string; includes: string[]; bestFor: string }[];
  psychologyTips: string[];
  commonMistakes: string[];
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

export default function PricingStrategy({ sessionEmail, isFree, price }: { sessionEmail: string; isFree: boolean; price: number }) {
  const [form, setForm] = useState({ startup: "", customer: "smb", costToServe: "", competitors: "", valueDelivered: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PricingResult | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const submit = async (payment?: { orderId: string; paymentId: string; signature: string }) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tools/pricing-strategy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, payment }) });
      const d = await res.json() as { result?: PricingResult; error?: string };
      if (!res.ok) { if (res.status === 402) setShowPayment(true); else setError(d.error ?? "Something went wrong"); setLoading(false); return; }
      setResult(d.result!);
    } catch { setError("Network error."); }
    setLoading(false);
  };

  const handlePayment = async () => {
    setLoading(true); setError("");
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setError("Payment SDK failed to load"); setLoading(false); return; }
      const orderRes = await fetch("/api/payment/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receipt: `ps_${Date.now()}`, tool: "readiness" }) });
      if (!orderRes.ok) { setError("Failed to create order"); setLoading(false); return; }
      const { orderId, amount } = await orderRes.json() as { orderId: string; amount: number };
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount, currency: "INR",
        name: "Devbridge", description: "Pricing Strategy — AI Tool", order_id: orderId,
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setShowPayment(false); await submit({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
        },
        prefill: { email: sessionEmail }, theme: { color: "#E8A838" },
        modal: { ondismiss: () => { setLoading(false); setShowPayment(false); } },
      });
      rzp.open();
    } catch { setError("Payment error."); setLoading(false); }
  };

  if (result) return (
    <div className="space-y-4">
      <div className="bg-[#E8A838]/10 border border-[#E8A838]/30 rounded-xl p-5">
        <p className="text-[#E8A838] text-xs uppercase tracking-wider mb-1">Recommended model</p>
        <h2 className="text-white text-xl font-bold mb-2">{result.recommendedModel}</h2>
        <p className="text-[#888] text-sm">{result.reasoning}</p>
      </div>
      <div>
        <p className="text-[#555] text-xs uppercase tracking-wider mb-3">Pricing Tiers</p>
        <div className="grid gap-3">
          {result.tiers.map((tier, i) => (
            <div key={i} className={`bg-[#111] border rounded-xl p-4 ${i === 1 ? "border-[#E8A838]/40" : "border-[#1a1a1a]"}`}>
              {i === 1 && <span className="text-[9px] text-[#E8A838] uppercase tracking-widest mb-2 block">Most popular</span>}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold">{tier.name}</h3>
                <span className="text-[#E8A838] font-bold">{tier.price}</span>
              </div>
              <ul className="space-y-1 mb-2">{tier.includes.map((inc, j) => <li key={j} className="text-[#888] text-xs flex gap-1.5"><span className="text-green-400">✓</span>{inc}</li>)}</ul>
              <p className="text-[#444] text-xs">Best for: {tier.bestFor}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
        <p className="text-[#555] text-xs uppercase tracking-wider mb-2">Pricing psychology tips</p>
        <ul className="space-y-1">{result.psychologyTips.map((tip, i) => <li key={i} className="text-[#ccc] text-sm flex gap-2"><span className="text-[#E8A838]">→</span>{tip}</li>)}</ul>
      </div>
      <div className="bg-[#111] border border-red-900/20 rounded-xl p-4">
        <p className="text-red-400 text-xs uppercase tracking-wider mb-2">Common mistakes to avoid</p>
        <ul className="space-y-1">{result.commonMistakes.map((m, i) => <li key={i} className="text-[#ccc] text-sm flex gap-2"><span className="text-red-400">✕</span>{m}</li>)}</ul>
      </div>
      <button onClick={() => setResult(null)} className="w-full py-3 border border-[#1a1a1a] text-[#555] rounded-xl text-sm hover:border-[#333] hover:text-[#888] transition">Start over</button>
    </div>
  );

  return (
    <>
      {showPayment && !isFree && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-crimson text-2xl text-white mb-1">Unlock Pricing Strategy</h2>
            <p className="text-[#666] text-sm mb-5">One-time payment · Delivered instantly.</p>
            <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-4 mb-5 flex items-center justify-between">
              <span className="text-[#888] text-sm">Pricing Strategy</span>
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
      <form onSubmit={(e) => { e.preventDefault(); if (!form.startup.trim()) { setError("Describe your startup"); return; } isFree ? submit() : setShowPayment(true); }} className="space-y-4">
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Your startup & product</label>
          <textarea value={form.startup} onChange={(e) => setForm({ ...form, startup: e.target.value })} placeholder="Describe your product, what it does, and key features..." rows={3} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Target customer</label>
            <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#E8A838] transition">
              {["consumer", "smb", "enterprise", "developer", "marketplace"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Cost to serve (monthly)</label>
            <input value={form.costToServe} onChange={(e) => setForm({ ...form, costToServe: e.target.value })} placeholder="e.g. ₹500/customer" className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition" />
          </div>
        </div>
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Competitors & their pricing (optional)</label>
          <input value={form.competitors} onChange={(e) => setForm({ ...form, competitors: e.target.value })} placeholder="e.g. Competitor A: ₹999/mo, Competitor B: ₹1499/mo" className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition" />
        </div>
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Value delivered to customer</label>
          <input value={form.valueDelivered} onChange={(e) => setForm({ ...form, valueDelivered: e.target.value })} placeholder="e.g. Saves 10 hours/week, reduces cost by 30%" className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition" />
        </div>
        {error && <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2"><p className="text-red-400 text-xs">{error}</p></div>}
        <button type="submit" disabled={loading} className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-50">
          {loading ? "Building your pricing strategy…" : isFree ? "Define Pricing Strategy →" : `Generate · ₹${(price / 100).toLocaleString("en-IN")}`}
        </button>
      </form>
    </>
  );
}
