"use client";

import { useState, useRef, useEffect } from "react";

type Stage = "form" | "payment" | "session" | "score";

type Exchange = { question: string; answer: string };

type ScoreData = {
  overall: number;
  strongestMoment: string;
  weakestMoment: string;
  improvements: string[];
  verdict: string;
};

const INVESTOR_OPTIONS = [
  { value: "angel", label: "Angel Investor", desc: "₹10–50L cheque, early-stage" },
  { value: "seed_vc", label: "Seed VC", desc: "₹50L–2Cr cheque, product-market fit focus" },
  { value: "series_a_vc", label: "Series A VC", desc: "₹5–20Cr cheque, scale & metrics focus" },
];


export default function PitchPractice({
  sessionCount,
  razorpayKey,
  priceDisplay,
  pricePaise,
}: {
  sessionCount: number;
  razorpayKey: string;
  priceDisplay: string;
  pricePaise: number;
}) {
  const isFree = sessionCount === 0;

  const [stage, setStage] = useState<Stage>("form");
  const [form, setForm] = useState({
    founderName: "",
    startupName: "",
    oneLiner: "",
    investorType: "angel" as "angel" | "seed_vc" | "series_a_vc",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<ScoreData | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [exchanges, currentQuestion]);

  useEffect(() => {
    if (stage === "session" && answerRef.current) answerRef.current.focus();
  }, [currentQuestion, stage]);

  const startSession = async (payment?: { orderId: string; paymentId: string; signature: string }) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pitch-practice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, payment }),
      });
      const d = await res.json() as { sessionId?: string; error?: string };
      if (!res.ok) { setError(d.error ?? "Failed to start"); setLoading(false); return; }
      setSessionId(d.sessionId!);
      setStage("session");
      await fetchFirstQuestion(d.sessionId!);
    } catch {
      setError("Network error. Try again.");
    }
    setLoading(false);
  };

  const fetchFirstQuestion = async (sid: string) => {
    const res = await fetch("/api/pitch-practice/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sid }),
    });
    const d = await res.json() as { question?: string; questionNumber?: number; done?: boolean; error?: string };
    if (d.question) {
      setCurrentQuestion(d.question);
      setQuestionNumber(d.questionNumber ?? 1);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !sessionId) return;
    setSubmitting(true);
    const myAnswer = answer.trim();
    setAnswer("");

    // Record exchange
    setExchanges((prev) => [...prev, { question: currentQuestion, answer: myAnswer }]);
    setCurrentQuestion("");

    if (questionNumber >= 10) {
      await completeSession(myAnswer);
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/pitch-practice/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, answer: myAnswer }),
    });
    const d = await res.json() as { question?: string; questionNumber?: number; done?: boolean; error?: string };

    if (d.done || !d.question) {
      await completeSession(myAnswer);
    } else {
      setCurrentQuestion(d.question!);
      setQuestionNumber(d.questionNumber ?? questionNumber + 1);
    }
    setSubmitting(false);
  };

  const completeSession = async (lastAnswer: string) => {
    const res = await fetch("/api/pitch-practice/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, lastAnswer }),
    });
    const d = await res.json() as { score?: ScoreData };
    if (d.score) { setScore(d.score); setStage("score"); }
  };

  const handleFormSubmit = async () => {
    if (!form.founderName.trim() || !form.startupName.trim() || !form.oneLiner.trim()) {
      setError("All fields are required");
      return;
    }
    if (isFree) {
      await startSession();
      return;
    }
    setStage("payment");
  };

  const handlePayment = async () => {
    setLoading(true);
    setError("");
    try {
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: `pp_${Date.now()}`, tool: "pitch_practice" }),
      });
      const orderData = await orderRes.json() as { orderId?: string; amount?: number; error?: string };
      if (!orderRes.ok || !orderData.orderId) {
        setError(orderData.error ?? "Failed to create order");
        setLoading(false);
        return;
      }

      if (typeof window.Razorpay === "undefined") {
        setError("Payment library not loaded. Please refresh.");
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpayKey,
        amount: orderData.amount ?? 0,
        currency: "INR",
        name: "Devbridge",
        description: "Pitch Practice Session",
        order_id: orderData.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await startSession({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
        },
        prefill: { name: form.founderName },
        theme: { color: "#E8A838" },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch {
      setError("Payment error. Try again.");
      setLoading(false);
    }
  };

  const scoreColor = (n: number) =>
    n >= 8 ? "text-green-400" : n >= 6 ? "text-[#E8A838]" : n >= 4 ? "text-orange-400" : "text-red-400";

  if (stage === "form") {
    return (
      <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          <div className="mb-10 text-center">
            <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-2">AI Pitch Practice</p>
            <h1 className="font-crimson text-3xl sm:text-4xl font-semibold text-white mb-3">Face a real investor</h1>
            <p className="text-[#555] text-sm">
              An AI investor grills you with 10 tough questions. You get a score, your strongest moment, and what to fix.
            </p>
            {isFree ? (
              <div className="mt-4 inline-block px-3 py-1 bg-[#1a1a0a] border border-[#E8A838]/30 rounded-full text-[#E8A838] text-xs">
                First session free
              </div>
            ) : (
              <div className="mt-4 inline-block px-3 py-1 bg-[#111] border border-[#222] rounded-full text-[#666] text-xs">
                {priceDisplay} per session · {sessionCount} session{sessionCount !== 1 ? "s" : ""} completed
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#555] block mb-1.5">Your name</label>
              <input
                value={form.founderName}
                onChange={(e) => setForm((f) => ({ ...f, founderName: e.target.value }))}
                placeholder="Rahul Mehta"
                className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50"
              />
            </div>
            <div>
              <label className="text-xs text-[#555] block mb-1.5">Startup name</label>
              <input
                value={form.startupName}
                onChange={(e) => setForm((f) => ({ ...f, startupName: e.target.value }))}
                placeholder="Kira Health"
                className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50"
              />
            </div>
            <div>
              <label className="text-xs text-[#555] block mb-1.5">One-line pitch</label>
              <input
                value={form.oneLiner}
                onChange={(e) => setForm((f) => ({ ...f, oneLiner: e.target.value }))}
                placeholder="We help rural pharmacies manage inventory and credit using WhatsApp"
                className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50"
              />
            </div>
            <div>
              <label className="text-xs text-[#555] block mb-1.5">Investor type</label>
              <div className="space-y-2">
                {INVESTOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm((f) => ({ ...f, investorType: opt.value as typeof form.investorType }))}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
                      form.investorType === opt.value
                        ? "border-[#E8A838] bg-[#1a1a0a] text-white"
                        : "border-[#222] text-[#666] hover:border-[#333]"
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs ml-2 opacity-60">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={handleFormSubmit}
              disabled={loading}
              className="w-full py-3.5 bg-[#E8A838] text-black font-semibold rounded-xl text-sm hover:bg-[#d4952e] transition disabled:opacity-50"
            >
              {loading ? "Starting…" : isFree ? "Start free session →" : `Pay ${priceDisplay} & start →`}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (stage === "payment") {
    return (
      <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
        <div className="max-w-md mx-auto text-center">
          <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-2">Pitch Practice</p>
          <h2 className="font-crimson text-3xl font-semibold text-white mb-2">{priceDisplay}</h2>
          <p className="text-[#555] text-sm mb-8">10 investor questions · instant score report · Groq AI</p>

          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6 mb-6 text-left space-y-3">
            <div className="text-xs text-[#444] uppercase tracking-widest mb-2">Session details</div>
            {[
              ["Startup", form.startupName],
              ["Investor", INVESTOR_OPTIONS.find((o) => o.value === form.investorType)?.label ?? ""],
              ["Pitch", form.oneLiner],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 text-sm">
                <span className="text-[#444] w-16 shrink-0">{k}</span>
                <span className="text-[#888] truncate">{v}</span>
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3.5 bg-[#E8A838] text-black font-semibold rounded-xl text-sm hover:bg-[#d4952e] transition disabled:opacity-50 mb-3"
          >
            {loading ? "Opening payment…" : `Pay ${priceDisplay}`}
          </button>
          <button onClick={() => setStage("form")} className="text-xs text-[#444] hover:text-[#888] transition">
            ← Edit details
          </button>

          <script src="https://checkout.razorpay.com/v1/checkout.js" async />
        </div>
      </main>
    );
  }

  if (stage === "session") {
    return (
      <main className="min-h-screen bg-[#0a0a0a] pt-12 pb-8 px-4">
        <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-5rem)]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <p className="text-xs text-[#444] uppercase tracking-widest">Pitch Practice</p>
              <p className="text-[#888] text-sm">{form.startupName} · {INVESTOR_OPTIONS.find((o) => o.value === form.investorType)?.label}</p>
            </div>
            <div className="text-xs text-[#444]">
              {questionNumber}/{10}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-[#1a1a1a] rounded mb-6 shrink-0">
            <div
              className="h-full bg-[#E8A838] rounded transition-all"
              style={{ width: `${(questionNumber / 10) * 100}%` }}
            />
          </div>

          {/* Chat transcript */}
          <div className="flex-1 overflow-y-auto space-y-6 pb-4">
            {exchanges.map((ex, i) => (
              <div key={i} className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[10px] text-[#555] shrink-0 mt-0.5">
                    AI
                  </div>
                  <p className="text-[#aaa] text-sm leading-relaxed">{ex.question}</p>
                </div>
                <div className="flex gap-3 justify-end">
                  <p className="text-white text-sm leading-relaxed bg-[#111] border border-[#1a1a1a] rounded-2xl px-4 py-2.5 max-w-[85%]">
                    {ex.answer}
                  </p>
                </div>
              </div>
            ))}

            {currentQuestion && (
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[10px] text-[#555] shrink-0 mt-0.5">
                  AI
                </div>
                <p className="text-[#aaa] text-sm leading-relaxed">{currentQuestion}</p>
              </div>
            )}

            {!currentQuestion && !submitting && (
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[10px] text-[#555] shrink-0 mt-0.5">
                  AI
                </div>
                <div className="flex gap-1 items-center pt-2">
                  <span className="w-1.5 h-1.5 bg-[#444] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#444] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#444] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Answer input */}
          {currentQuestion && (
            <div className="shrink-0 pt-4 border-t border-[#1a1a1a]">
              <textarea
                ref={answerRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }}
                placeholder="Type your answer… (Enter to send)"
                rows={3}
                className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50 resize-none"
                disabled={submitting}
              />
              <button
                onClick={submitAnswer}
                disabled={submitting || !answer.trim()}
                className="mt-2 w-full py-2.5 bg-[#E8A838] text-black text-sm font-medium rounded-xl hover:bg-[#d4952e] transition disabled:opacity-40"
              >
                {submitting ? (questionNumber >= 10 ? "Generating score…" : "Thinking…") : questionNumber >= 10 ? "Submit final answer →" : "Send answer →"}
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (stage === "score" && score) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-2">Session Complete</p>
            <div className={`font-crimson text-7xl font-semibold mb-2 ${scoreColor(score.overall)}`}>{score.overall}<span className="text-3xl text-[#333]">/10</span></div>
            <p className="text-[#555] text-sm">{form.startupName} · {INVESTOR_OPTIONS.find((o) => o.value === form.investorType)?.label}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5">
              <p className="text-xs text-[#444] uppercase tracking-widest mb-2">Verdict</p>
              <p className="text-[#aaa] text-sm leading-relaxed">{score.verdict}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5">
                <p className="text-xs text-green-500 uppercase tracking-widest mb-2">Strongest moment</p>
                <p className="text-[#aaa] text-sm leading-relaxed">{score.strongestMoment}</p>
              </div>
              <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5">
                <p className="text-xs text-red-400 uppercase tracking-widest mb-2">Biggest gap</p>
                <p className="text-[#aaa] text-sm leading-relaxed">{score.weakestMoment}</p>
              </div>
            </div>

            <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5">
              <p className="text-xs text-[#444] uppercase tracking-widest mb-3">3 things to fix before your next pitch</p>
              <ol className="space-y-2">
                {score.improvements.map((imp, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-[#E8A838] font-medium shrink-0">{i + 1}.</span>
                    <span className="text-[#888]">{imp}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => { setStage("form"); setExchanges([]); setScore(null); setCurrentQuestion(""); setQuestionNumber(0); }}
              className="flex-1 py-3 border border-[#222] text-[#666] text-sm rounded-xl hover:border-[#444] hover:text-white transition"
            >
              Practice again
            </button>
            <a href="/" className="flex-1 py-3 bg-[#E8A838] text-black text-sm font-medium rounded-xl text-center hover:bg-[#d4952e] transition">
              Back to tools
            </a>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
