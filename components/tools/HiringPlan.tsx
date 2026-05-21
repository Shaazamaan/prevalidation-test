"use client";
import { useState } from "react";

type HireRole = { role: string; when: string; why: string; costRange: string; redFlags: string };
type HiringResult = { summary: string; hires: HireRole[]; hiringPrinciples: string[]; mistakesToAvoid: string[] };

declare global {
  interface Window { Razorpay: new (opts: Record<string, unknown>) => { open(): void }; }
}
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("rzp-sdk")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id = "rzp-sdk"; s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function HiringPlan({ sessionEmail, isFree, price }: { sessionEmail: string; isFree: boolean; price: number }) {
  const [form, setForm] = useState({ startup: "", currentTeam: "", runway: "12", nextGoal: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<HiringResult | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const submit = async (payment?: { orderId: string; paymentId: string; signature: string }) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tools/hiring-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, payment }) });
      const d = await res.json() as { result?: HiringResult; error?: string };
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
      const orderRes = await fetch("/api/payment/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receipt: `hp_${Date.now()}`, tool: "readiness" }) });
      if (!orderRes.ok) { setError("Failed to create order"); setLoading(false); return; }
      const { orderId, amount } = await orderRes.json() as { orderId: string; amount: number };
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount, currency: "INR",
        name: "Devbridge", description: "First Hiring Plan — AI Tool", order_id: orderId,
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
      <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
        <p className="text-[#555] text-xs uppercase tracking-wider mb-2">Hiring strategy</p>
        <p className="text-[#ccc] text-sm">{result.summary}</p>
      </div>
      <div>
        <p className="text-[#555] text-xs uppercase tracking-wider mb-3">Your first-year hires</p>
        <div className="space-y-3">
          {result.hires.map((hire, i) => (
            <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-white font-semibold">{hire.role}</h3>
                <span className="text-[#E8A838] text-xs shrink-0">{hire.when}</span>
              </div>
              <p className="text-[#888] text-sm mb-2">{hire.why}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-400">{hire.costRange}</span>
                <span className="text-red-400 text-right max-w-[60%]">⚠ {hire.redFlags}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
        <p className="text-[#555] text-xs uppercase tracking-wider mb-2">Hiring principles</p>
        <ul className="space-y-1">{result.hiringPrinciples.map((p, i) => <li key={i} className="text-[#ccc] text-sm flex gap-2"><span className="text-[#E8A838]">→</span>{p}</li>)}</ul>
      </div>
      <div className="bg-[#111] border border-red-900/20 rounded-xl p-4">
        <p className="text-red-400 text-xs uppercase tracking-wider mb-2">Mistakes to avoid</p>
        <ul className="space-y-1">{result.mistakesToAvoid.map((m, i) => <li key={i} className="text-[#ccc] text-sm flex gap-2"><span className="text-red-400">✕</span>{m}</li>)}</ul>
      </div>
      <button onClick={() => setResult(null)} className="w-full py-3 border border-[#1a1a1a] text-[#555] rounded-xl text-sm hover:border-[#333] hover:text-[#888] transition">Start over</button>
    </div>
  );

  return (
    <>
      {showPayment && !isFree && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-crimson text-2xl text-white mb-1">Unlock First Hiring Plan</h2>
            <p className="text-[#666] text-sm mb-5">One-time payment · Delivered instantly.</p>
            <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-4 mb-5 flex items-center justify-between">
              <span className="text-[#888] text-sm">First Hiring Plan</span>
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
      <form onSubmit={(e) => { e.preventDefault(); if (!form.startup.trim() || !form.nextGoal.trim()) { setError("Fill required fields"); return; } isFree ? submit() : setShowPayment(true); }} className="space-y-4">
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Startup description</label>
          <textarea value={form.startup} onChange={(e) => setForm({ ...form, startup: e.target.value })} placeholder="What does your startup do? What stage are you at?" rows={3} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition resize-none" />
        </div>
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Current team</label>
          <input value={form.currentTeam} onChange={(e) => setForm({ ...form, currentTeam: e.target.value })} placeholder="e.g. 2 founders (1 tech, 1 business), no employees yet" className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Runway (months)</label>
            <select value={form.runway} onChange={(e) => setForm({ ...form, runway: e.target.value })} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#E8A838] transition">
              {["6", "9", "12", "18", "24"].map(r => <option key={r} value={r}>{r} months</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Next milestone</label>
            <input value={form.nextGoal} onChange={(e) => setForm({ ...form, nextGoal: e.target.value })} placeholder="e.g. 100 paying customers" className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition" />
          </div>
        </div>
        {error && <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2"><p className="text-red-400 text-xs">{error}</p></div>}
        <button type="submit" disabled={loading} className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-50">
          {loading ? "Building your hiring plan…" : isFree ? "Build Hiring Plan →" : `Generate · ₹${(price / 100).toLocaleString("en-IN")}`}
        </button>
      </form>
    </>
  );
}
