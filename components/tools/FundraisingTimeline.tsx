"use client";
import { useState } from "react";

type Milestone = { month: string; task: string; outcome: string; critical: boolean };
type FundraisingResult = {
  stage: string;
  targetAmount: string;
  timeToClose: string;
  overview: string;
  milestones: Milestone[];
  investorTargets: string[];
  redFlags: string[];
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

export default function FundraisingTimeline({ sessionEmail, isFree, price }: { sessionEmail: string; isFree: boolean; price: number }) {
  const [form, setForm] = useState({ startup: "", traction: "", targetAmount: "", stage: "pre-seed" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FundraisingResult | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const submit = async (payment?: { orderId: string; paymentId: string; signature: string }) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tools/fundraising-timeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, payment }) });
      const d = await res.json() as { result?: FundraisingResult; error?: string };
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
      const orderRes = await fetch("/api/payment/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receipt: `ft_${Date.now()}`, tool: "readiness" }) });
      if (!orderRes.ok) { setError("Failed to create order"); setLoading(false); return; }
      const { orderId, amount } = await orderRes.json() as { orderId: string; amount: number };
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount, currency: "INR",
        name: "Devbridge", description: "Fundraising Timeline — AI Tool", order_id: orderId,
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
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Stage", value: result.stage },
          { label: "Target", value: result.targetAmount },
          { label: "Time to close", value: result.timeToClose },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-3 text-center">
            <p className="text-[#555] text-[10px] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-[#E8A838] font-bold text-sm">{value}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
        <p className="text-[#555] text-xs uppercase tracking-wider mb-2">Overview</p>
        <p className="text-[#ccc] text-sm">{result.overview}</p>
      </div>
      <div>
        <p className="text-[#555] text-xs uppercase tracking-wider mb-3">Milestone roadmap</p>
        <div className="space-y-2">
          {result.milestones.map((m, i) => (
            <div key={i} className={`flex gap-4 p-3 rounded-xl border ${m.critical ? "bg-[#E8A838]/5 border-[#E8A838]/20" : "bg-[#111] border-[#1a1a1a]"}`}>
              <div className="shrink-0 w-16 text-center">
                <p className="text-[#E8A838] text-xs font-bold">{m.month}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${m.critical ? "text-white" : "text-[#ccc]"}`}>{m.task}</p>
                <p className="text-[#555] text-xs mt-0.5">{m.outcome}</p>
              </div>
              {m.critical && <span className="text-[9px] text-[#E8A838] border border-[#E8A838]/30 rounded px-1.5 py-0.5 shrink-0 h-fit">Key</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
        <p className="text-[#555] text-xs uppercase tracking-wider mb-2">Types of investors to target</p>
        <ul className="space-y-1">{result.investorTargets.map((t, i) => <li key={i} className="text-[#ccc] text-sm flex gap-2"><span className="text-[#E8A838]">→</span>{t}</li>)}</ul>
      </div>
      <div className="bg-[#111] border border-red-900/20 rounded-xl p-4">
        <p className="text-red-400 text-xs uppercase tracking-wider mb-2">Warning signs you're not ready</p>
        <ul className="space-y-1">{result.redFlags.map((f, i) => <li key={i} className="text-[#ccc] text-sm flex gap-2"><span className="text-red-400">⚠</span>{f}</li>)}</ul>
      </div>
      <button onClick={() => setResult(null)} className="w-full py-3 border border-[#1a1a1a] text-[#555] rounded-xl text-sm hover:border-[#333] hover:text-[#888] transition">Start over</button>
    </div>
  );

  return (
    <>
      {showPayment && !isFree && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-crimson text-2xl text-white mb-1">Unlock Fundraising Timeline</h2>
            <p className="text-[#666] text-sm mb-5">One-time payment · Delivered instantly.</p>
            <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-4 mb-5 flex items-center justify-between">
              <span className="text-[#888] text-sm">Fundraising Timeline</span>
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
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Startup description</label>
          <textarea value={form.startup} onChange={(e) => setForm({ ...form, startup: e.target.value })} placeholder="What does your startup do? What problem does it solve?" rows={3} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition resize-none" />
        </div>
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Current traction</label>
          <input value={form.traction} onChange={(e) => setForm({ ...form, traction: e.target.value })} placeholder="e.g. 50 beta users, ₹2L MRR, pilot with 3 companies" className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Funding stage</label>
            <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#E8A838] transition">
              {["pre-seed", "seed", "series-a"].map(s => <option key={s} value={s}>{s.replace("-", " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Target amount</label>
            <input value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="e.g. ₹50L or $500K" className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition" />
          </div>
        </div>
        {error && <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2"><p className="text-red-400 text-xs">{error}</p></div>}
        <button type="submit" disabled={loading} className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-50">
          {loading ? "Building your roadmap…" : isFree ? "Build Fundraising Timeline →" : `Generate · ₹${(price / 100).toLocaleString("en-IN")}`}
        </button>
      </form>
    </>
  );
}
