"use client";

import { useState } from "react";

type PivotIdea = {
  idea: string;
  whyBetter: string;
  keyChange: string;
  risk: string;
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

export default function PivotAdvisor({
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
    readinessScore: 50,
    weakness: "market",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PivotIdea[] | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const weaknessOptions = [
    { value: "market", label: "Market — wrong audience or too small" },
    { value: "team", label: "Team — missing skills or co-founder" },
    { value: "product", label: "Product — wrong features or tech" },
    { value: "traction", label: "Traction — no users or growth" },
    { value: "timing", label: "Timing — too early or too late" },
  ];

  const submit = async (payment?: { orderId: string; paymentId: string; signature: string }) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/pivot-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, payment }),
      });
      const d = await res.json() as { result?: PivotIdea[]; error?: string; price?: number };
      if (!res.ok) {
        if (res.status === 402) {
          setShowPayment(true);
        } else {
          setError(d.error ?? "Something went wrong");
        }
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
    if (!form.idea.trim()) { setError("Please describe your startup idea"); return; }
    if (isFree) {
      await submit();
    } else {
      setShowPayment(true);
    }
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
        body: JSON.stringify({ receipt: `pivot_${Date.now()}`, tool: "readiness" }),
      });
      if (!orderRes.ok) { setError("Failed to create order"); setLoading(false); return; }
      const { orderId, amount } = await orderRes.json() as { orderId: string; amount: number };
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency: "INR",
        name: "Devbridge",
        description: "Pivot Advisor — AI Tool",
        order_id: orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setShowPayment(false);
          await submit({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
        },
        prefill: { email: sessionEmail },
        theme: { color: "#E8A838" },
        modal: { ondismiss: () => { setLoading(false); setShowPayment(false); } },
      });
      rzp.open();
    } catch {
      setError("Payment error. Please try again.");
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-green-400 text-sm">3 pivot ideas generated</span>
        </div>
        <div className="space-y-4">
          {result.map((pivot, i) => (
            <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[#E8A838] font-bold text-lg leading-none mt-0.5">#{i + 1}</span>
                <h3 className="text-white font-medium leading-snug">{pivot.idea}</h3>
              </div>
              <div className="space-y-3 pl-6">
                <div>
                  <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Why better</p>
                  <p className="text-[#aaa] text-sm">{pivot.whyBetter}</p>
                </div>
                <div>
                  <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Key change</p>
                  <p className="text-[#E8A838] text-sm">{pivot.keyChange}</p>
                </div>
                <div>
                  <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Risk</p>
                  <p className="text-red-400 text-sm">{pivot.risk}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => { setResult(null); setError(""); }}
          className="mt-6 w-full py-3 border border-[#1a1a1a] text-[#555] rounded-xl text-sm hover:border-[#333] hover:text-[#888] transition"
        >
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
            <h2 className="font-crimson text-2xl text-white mb-1">Unlock Pivot Advisor</h2>
            <p className="text-[#666] text-sm mb-5">One-time payment · Results delivered instantly.</p>
            <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-[#888] text-sm">Pivot Advisor</span>
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
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Your startup idea</label>
          <textarea
            value={form.idea}
            onChange={(e) => setForm({ ...form, idea: e.target.value })}
            placeholder="Describe your startup idea, what it does, and who it's for..."
            rows={4}
            className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition resize-none"
          />
        </div>
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">
            Current readiness score: <span className="text-[#E8A838]">{form.readinessScore}</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={form.readinessScore}
            onChange={(e) => setForm({ ...form, readinessScore: parseInt(e.target.value) })}
            className="w-full accent-[#E8A838]"
          />
          <div className="flex justify-between text-[#333] text-xs mt-1">
            <span>0 — Idea stage</span>
            <span>100 — Ready to scale</span>
          </div>
        </div>
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Biggest weakness</label>
          <select
            value={form.weakness}
            onChange={(e) => setForm({ ...form, weakness: e.target.value })}
            className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#E8A838] transition"
          >
            {weaknessOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating pivots…" : isFree ? "Generate Pivot Ideas →" : `Generate · ₹${(price / 100).toLocaleString("en-IN")}`}
        </button>
      </form>
    </>
  );
}
