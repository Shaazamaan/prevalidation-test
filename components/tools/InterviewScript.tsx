"use client";

import { useState } from "react";

type Question = { q: string; why: string; followUp: string };
type InterviewResult = { opening: string; questions: Question[]; closing: string };

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

export default function InterviewScript({
  sessionEmail,
  isFree,
  price,
}: {
  sessionEmail: string;
  isFree: boolean;
  price: number;
}) {
  const [form, setForm] = useState({ idea: "", targetCustomer: "", assumption: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const submit = async (payment?: { orderId: string; paymentId: string; signature: string }) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/interview-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, payment }),
      });
      const d = await res.json() as { result?: InterviewResult; error?: string };
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
    if (!form.idea.trim() || !form.targetCustomer.trim() || !form.assumption.trim()) {
      setError("All fields are required");
      return;
    }
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
        body: JSON.stringify({ receipt: `interview_${Date.now()}`, tool: "readiness" }),
      });
      if (!orderRes.ok) { setError("Failed to create order"); setLoading(false); return; }
      const { orderId, amount } = await orderRes.json() as { orderId: string; amount: number };
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount, currency: "INR", name: "Devbridge",
        description: "Customer Interview Script — AI Tool",
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

  if (result) {
    return (
      <div>
        <div className="mb-4 bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-[#555] text-xs uppercase tracking-wider mb-2">Opening</p>
          <p className="text-[#aaa] text-sm leading-relaxed">{result.opening}</p>
        </div>
        <div className="space-y-2 mb-4">
          {result.questions.map((q, i) => (
            <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#141414] transition"
              >
                <span className="text-white text-sm">
                  <span className="text-[#E8A838] font-mono text-xs mr-2">Q{i + 1}</span>
                  {q.q}
                </span>
                <span className="text-[#333] text-lg leading-none ml-2 shrink-0">{expanded === i ? "−" : "+"}</span>
              </button>
              {expanded === i && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#1a1a1a]">
                  <div>
                    <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Why ask this</p>
                    <p className="text-[#888] text-sm">{q.why}</p>
                  </div>
                  <div>
                    <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Follow-up probe</p>
                    <p className="text-[#E8A838] text-sm">{q.followUp}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 mb-4">
          <p className="text-[#555] text-xs uppercase tracking-wider mb-2">Closing</p>
          <p className="text-[#aaa] text-sm leading-relaxed">{result.closing}</p>
        </div>
        <button onClick={() => { setResult(null); setExpanded(null); }} className="w-full py-3 border border-[#1a1a1a] text-[#555] rounded-xl text-sm hover:border-[#333] hover:text-[#888] transition">
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
            <h2 className="font-crimson text-2xl text-white mb-1">Unlock Interview Script</h2>
            <p className="text-[#666] text-sm mb-5">15 tailored questions · Delivered instantly.</p>
            <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-[#888] text-sm">Interview Script</span>
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
          <input type="text" value={form.targetCustomer} onChange={(e) => setForm({ ...form, targetCustomer: e.target.value })} placeholder="e.g., Small business owners in retail" className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition" />
        </div>
        <div>
          <label className="block text-[#888] text-xs uppercase tracking-wider mb-2">Biggest assumption to validate</label>
          <textarea value={form.assumption} onChange={(e) => setForm({ ...form, assumption: e.target.value })} placeholder="e.g., Customers will pay ₹500/month for this feature" rows={2} className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition resize-none" />
        </div>
        {error && <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2"><p className="text-red-400 text-xs">{error}</p></div>}
        <button type="submit" disabled={loading} className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Generating script…" : isFree ? "Generate Interview Script →" : `Generate · ₹${(price / 100).toLocaleString("en-IN")}`}
        </button>
      </form>
    </>
  );
}
