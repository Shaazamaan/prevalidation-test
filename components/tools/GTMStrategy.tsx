"use client";

import { useState } from "react";

type Channel = { name: string; tactics: string; metrics: string };
type GTMResult = {
  week1_4: string[];
  week5_8: string[];
  week9_12: string[];
  channels: Channel[];
  northStar: string;
};


function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("rzp-sdk")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id = "rzp-sdk";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function GTMStrategy({
  sessionEmail,
  isFree,
  price,
}: {
  sessionEmail: string;
  isFree: boolean;
  price: number;
}) {
  const [form, setForm] = useState({
    idea: "",
    targetCustomer: "",
    stage: "pre-revenue",
    primaryChannel: "online",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GTMResult | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const submit = async (payment?: { orderId: string; paymentId: string; signature: string }) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/gtm-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, payment }),
      });
      const d = await res.json() as { result?: GTMResult; error?: string };
      if (!res.ok) {
        if (res.status === 402) { setShowPayment(true); }
        else { setError(d.error ?? "Something went wrong"); }
        setLoading(false);
        return;
      }
      setResult(d.result!);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idea.trim() || !form.targetCustomer.trim()) { setError("Startup idea and target customer are required"); return; }
    if (isFree) { await submit(); } else { setShowPayment(true); }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError("");
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setError("Payment SDK failed to load"); setLoading(false); return; }
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: `gtm_${Date.now()}`, tool: "readiness" }),
      });
      if (!orderRes.ok) { setError("Failed to create order"); setLoading(false); return; }
      const { orderId, amount } = await orderRes.json() as { orderId: string; amount: number };
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount, currency: "INR", name: "Devbridge",
        description: "GTM Strategy — AI Tool",
        order_id: orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setShowPayment(false);
          await submit({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature });
        },
        prefill: { email: sessionEmail },
        theme: { color: "#E8A838" },
        modal: { ondismiss: () => { setLoading(false); setShowPayment(false); } },
      });
      rzp.open();
    } catch { setError("Payment error."); setLoading(false); }
  };

  const phases = result ? [
    { label: "Weeks 1–4", items: result.week1_4, color: "text-blue-400" },
    { label: "Weeks 5–8", items: result.week5_8, color: "text-[#E8A838]" },
    { label: "Weeks 9–12", items: result.week9_12, color: "text-green-400" },
  ] : [];

  if (result) {
    return (
      <div>
        <div className="mb-4 bg-[#0d1a0d] border border-green-900/30 rounded-xl p-4">
          <p className="text-[#555] text-xs uppercase tracking-wider mb-1">North Star Metric</p>
          <p className="text-green-400 font-medium">{result.northStar}</p>
        </div>
        <div className="grid gap-4 mb-6">
          {phases.map((phase) => (
            <div key={phase.label} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
              <p className={`text-xs font-mono uppercase tracking-wider mb-3 ${phase.color}`}>{phase.label}</p>
              <ul className="space-y-2">
                {phase.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-[#aaa]">
                    <span className="text-[#333] mt-1">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="space-y-3 mb-6">
          <p className="text-[#555] text-xs uppercase tracking-wider">Channel Tactics</p>
          {result.channels.map((ch, i) => (
            <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
              <p className="text-white font-medium mb-2">{ch.name}</p>
              <p className="text-[#888] text-sm mb-2">{ch.tactics}</p>
              <p className="text-[#555] text-xs">Track: <span className="text-[#E8A838]">{ch.metrics}</span></p>
            </div>
          ))}
        </div>
        <button onClick={() => setResult(null)} className="w-full py-3 border border-[#1a1a1a] text-[#555] rounded-xl text-sm hover:border-[#333] hover:text-[#888] transition">
          Start over
        </button>
      </div>
    );
  }

  return (
    <>
      {showPayment && !isFree && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-crimson text-2xl text-white mb-1">Unlock GTM Strategy</h2>
            <p className="text-[#666] text-sm mb-5">90-day plan · Channels · North Star · Instant.</p>
            <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-[#888] text-sm">GTM Strategy</span>
                <span className="text-[#E8A838] font-bold text-xl">₹{(price / 100).toLocaleString("en-IN")}</span>
              </div>
            </div>
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setShowPayment(false); setLoading(false); }} className="flex-1 bg-[#1a1a1a] border border-[#333] text-[#666] py-3 rounded-xl text-sm hover:text-white transition">Cancel</button>
              <button onClick={handlePayment} disabled={loading} className="flex-1 bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-50">
                {loading ? "Opening…" : `Pay ₹${(price / 100).toLocaleString("en-IN")}`}
              </button>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Startup idea</label>
          <textarea value={form.idea} onChange={(e) => setForm({ ...form, idea: e.target.value })} placeholder="What does your startup do?" rows={3} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition resize-none" />
        </div>
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Target customer</label>
          <input type="text" value={form.targetCustomer} onChange={(e) => setForm({ ...form, targetCustomer: e.target.value })} placeholder="Who are you selling to?" className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Stage</label>
            <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#E8A838] transition">
              <option value="pre-revenue">Pre-revenue</option>
              <option value="early-revenue">Early revenue</option>
              <option value="scaling">Scaling</option>
            </select>
          </div>
          <div>
            <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Primary channel</label>
            <select value={form.primaryChannel} onChange={(e) => setForm({ ...form, primaryChannel: e.target.value })} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#E8A838] transition">
              <option value="online">Online / Digital</option>
              <option value="offline">Offline / Events</option>
              <option value="b2b-sales">B2B Sales</option>
              <option value="community">Community</option>
            </select>
          </div>
        </div>
        {error && <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2"><p className="text-red-400 text-xs">{error}</p></div>}
        <button type="submit" disabled={loading} className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Building GTM plan…" : isFree ? "Generate GTM Strategy →" : `Generate · ₹${(price / 100).toLocaleString("en-IN")}`}
        </button>
      </form>
    </>
  );
}
