"use client";
import { useState } from "react";

type OnePagerResult = {
  tagline: string;
  problem: string;
  solution: string;
  marketSize: string;
  businessModel: string;
  traction: string;
  team: string;
  ask: string;
};

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

export default function OnePager({ sessionEmail, isFree, price }: { sessionEmail: string; isFree: boolean; price: number }) {
  const [form, setForm] = useState({ startup: "", problem: "", solution: "", traction: "", ask: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OnePagerResult | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const submit = async (payment?: { orderId: string; paymentId: string; signature: string }) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/tools/one-pager", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, payment }) });
      const d = await res.json() as { result?: OnePagerResult; error?: string };
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
      const orderRes = await fetch("/api/payment/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receipt: `op_${Date.now()}`, tool: "readiness" }) });
      if (!orderRes.ok) { setError("Failed to create order"); setLoading(false); return; }
      const { orderId, amount } = await orderRes.json() as { orderId: string; amount: number };
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount, currency: "INR",
        name: "Devbridge", description: "Investor One-Pager — AI Tool", order_id: orderId,
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
    <div>
      <div className="mb-4 p-4 bg-[#E8A838]/10 border border-[#E8A838]/30 rounded-xl">
        <p className="text-[#E8A838] text-xs uppercase tracking-wider mb-1">Tagline</p>
        <p className="text-white text-xl font-semibold">{result.tagline}</p>
      </div>
      <div className="grid gap-3">
        {[
          { label: "Problem", value: result.problem, color: "text-red-400" },
          { label: "Solution", value: result.solution, color: "text-green-400" },
          { label: "Market Size", value: result.marketSize, color: "text-blue-400" },
          { label: "Business Model", value: result.businessModel, color: "text-[#E8A838]" },
          { label: "Traction", value: result.traction, color: "text-purple-400" },
          { label: "Team", value: result.team, color: "text-cyan-400" },
          { label: "The Ask", value: result.ask, color: "text-[#E8A838]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
            <p className={`text-xs uppercase tracking-wider mb-2 ${color}`}>{label}</p>
            <p className="text-[#ccc] text-sm">{value}</p>
          </div>
        ))}
      </div>
      <button onClick={() => setResult(null)} className="mt-6 w-full py-3 border border-[#1a1a1a] text-[#555] rounded-xl text-sm hover:border-[#333] hover:text-[#888] transition">Start over</button>
    </div>
  );

  const fields = [
    ["Startup name & what it does", "startup", "e.g. Flowly — automated bookkeeping for freelancers"],
    ["Problem you're solving", "problem", "What pain exists and who feels it?"],
    ["Your solution", "solution", "How does your product solve it uniquely?"],
    ["Traction (if any)", "traction", "Users, revenue, pilots, waitlist..."],
    ["Funding ask & use of funds", "ask", "e.g. Raising ₹50L for product and first 10 customers"],
  ] as const;

  return (
    <>
      {showPayment && !isFree && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-crimson text-2xl text-white mb-1">Unlock Investor One-Pager</h2>
            <p className="text-[#666] text-sm mb-5">One-time payment · Results delivered instantly.</p>
            <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-4 mb-5 flex items-center justify-between">
              <span className="text-[#888] text-sm">Investor One-Pager</span>
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
      <form onSubmit={(e) => { e.preventDefault(); if (!form.startup.trim() || !form.problem.trim()) { setError("Fill in required fields"); return; } isFree ? submit() : setShowPayment(true); }} className="space-y-4">
        {fields.map(([label, key, ph]) => (
          <div key={key}>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">{label}</label>
            <textarea value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={ph} rows={2} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition resize-none" />
          </div>
        ))}
        {error && <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2"><p className="text-red-400 text-xs">{error}</p></div>}
        <button type="submit" disabled={loading} className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-50">
          {loading ? "Writing your one-pager…" : isFree ? "Generate One-Pager →" : `Generate · ₹${(price / 100).toLocaleString("en-IN")}`}
        </button>
      </form>
    </>
  );
}
