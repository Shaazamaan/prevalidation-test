"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/lib/questions";
import PaymentModal, { type PaymentResult } from "@/components/PaymentModal";

type Props = {
  sessionId: string;
  founderName: string;
  startupIdea: string;
};

const TOTAL = QUESTIONS.length;
const MIN_CHARS = 30;
const STORAGE_KEY = (id: string) => `pv_answers_${id}`;
const FLAG_KEY = (id: string) => `pv_flags_${id}`;
const MAX_FLAGS = 5;

const TIPS = [
  "Vague answers get vague results. Write as if explaining to a sceptical investor.",
  "The more specific you are, the more useful your report will be.",
  "It's okay to say 'I don't know yet' — that's honest data for the evaluation.",
  "Think about one real person experiencing this problem, not an abstract group.",
  "Numbers and dates beat adjectives. Replace 'many' with an actual count.",
  "If you're tempted to describe your solution, come back to the problem.",
  "The hardest questions are the most important ones. Don't rush them.",
  "Your competitors' weaknesses are only valuable if you can reliably exploit them.",
];

const PHASES = Array.from(new Set(QUESTIONS.map((q) => q.phase)));

function getPhaseStart(phase: number): number {
  return QUESTIONS.findIndex((q) => q.phase === phase);
}

export default function QuestionnaireInterface({ sessionId, founderName, startupIdea }: Props) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(TOTAL).fill(""));
  const [flags, setFlags] = useState<boolean[]>(Array(TOTAL).fill(false));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [showPhaseNav, setShowPhaseNav] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedAnswers = localStorage.getItem(STORAGE_KEY(sessionId));
      const parsedAnswers = storedAnswers ? JSON.parse(storedAnswers) : null;
      if (Array.isArray(parsedAnswers) && parsedAnswers.length === TOTAL) {
        setAnswers(parsedAnswers);
      }
      const storedFlags = localStorage.getItem(FLAG_KEY(sessionId));
      const parsedFlags = storedFlags ? JSON.parse(storedFlags) : null;
      if (Array.isArray(parsedFlags) && parsedFlags.length === TOTAL) {
        setFlags(parsedFlags);
      }
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY(sessionId), JSON.stringify(answers));
    } catch {}
  }, [answers, sessionId, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(FLAG_KEY(sessionId), JSON.stringify(flags));
    } catch {}
  }, [flags, sessionId, mounted]);

  useEffect(() => {
    textareaRef.current?.focus();
    setShowHint(false);
    setShowExample(false);
  }, [current]);

  useEffect(() => {
    const t = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 12000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!mounted || current === 0 || current % 5 !== 0) return;
    fetch("/api/session/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, phase: QUESTIONS[current].phase }),
    }).catch(() => {});
  }, [current, sessionId, mounted]);

  const q = QUESTIONS[current];
  const isLast = current === TOTAL - 1;
  const progress = ((current + 1) / TOTAL) * 100;
  const flagCount = flags.filter(Boolean).length;
  const answer = answers[current] ?? "";
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const charCount = answer.length;
  const canAdvance = answer.trim().length >= MIN_CHARS || flags[current];

  const setAnswer = useCallback((val: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = val;
      return next;
    });
  }, [current]);

  const toggleFlag = useCallback(() => {
    setFlags((prev) => {
      const next = [...prev];
      next[current] = !next[current];
      return next;
    });
  }, [current]);

  const handleNext = () => {
    if (!canAdvance) return;
    if (isLast) {
      setShowPayment(true);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const handleBack = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleNext();
    }
  };

  const handlePaymentSuccess = async (payment: PaymentResult) => {
    setShowPayment(false);
    if (submitted || submitting) return;
    setSubmitted(true);
    setSubmitting(true);
    setError("");

    const payload = QUESTIONS.map((q, i) => ({
      question: q.question,
      answer: flags[i]
        ? (answers[i] ?? "").trim() || "I haven't thought about this yet."
        : (answers[i] ?? "") || "(no answer)",
      phase: q.phase,
    }));

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers: payload, payment }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        setSubmitted(false);
        return;
      }

      try {
        localStorage.removeItem(STORAGE_KEY(sessionId));
        localStorage.removeItem(FLAG_KEY(sessionId));
      } catch {}

      router.push(`/report/${sessionId}`);
    } catch {
      setError("Connection error. Check your internet and try again.");
      setSubmitting(false);
      setSubmitted(false);
    }
  };

  if (submitting) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="font-crimson text-2xl text-white mb-2">Evaluating your answers…</p>
          <p className="text-[#666] text-sm mb-6">This takes 20–40 seconds. Please don't close this tab.</p>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4">
            <p className="text-xs text-[#555] uppercase mb-1">Evaluating</p>
            <p className="text-[#888] text-sm">{founderName}'s startup readiness across 14 dimensions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {showPayment && (
        <PaymentModal
          description="Founder Readiness Report"
          founderName={founderName}
          receipt={`frc-${sessionId.slice(0, 20)}`}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}

      {/* Header */}
      <header className="shrink-0 px-4 py-3 border-b border-[#1a1a1a] bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="font-crimson text-base sm:text-lg text-white font-semibold">
            Founder Readiness Check
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-[#555]">{current + 1}/{TOTAL}</span>
            <button
              onClick={() => setShowPhaseNav((v) => !v)}
              className="text-xs text-[#666] hover:text-[#E8A838] transition px-2 py-1 border border-[#222] rounded"
            >
              Phases
            </button>
          </div>
        </div>
      </header>

      {/* Phase nav dropdown */}
      {showPhaseNav && (
        <div className="bg-[#111] border-b border-[#222] px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-[#555] mb-2 uppercase">Jump to phase</p>
            <div className="flex flex-wrap gap-2">
              {PHASES.map((phase) => {
                const start = getPhaseStart(phase);
                const phaseTitle = QUESTIONS[start].phaseTitle;
                const phaseQs = QUESTIONS.filter((q) => q.phase === phase);
                const answeredCount = phaseQs.filter((_, i) => {
                  const globalIdx = start + i;
                  return (answers[globalIdx] ?? "").trim().length >= MIN_CHARS;
                }).length;
                return (
                  <button
                    key={phase}
                    onClick={() => { setCurrent(start); setShowPhaseNav(false); }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      q.phase === phase
                        ? "border-[#E8A838] text-[#E8A838] bg-[#E8A838]/10"
                        : "border-[#222] text-[#666] hover:text-white hover:border-[#444]"
                    }`}
                  >
                    {phase}. {phaseTitle}
                    {answeredCount === phaseQs.length && (
                      <span className="ml-1 text-green-500">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#1a1a1a] shrink-0">
        <div
          className="h-1 bg-[#E8A838] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Startup idea strip */}
      <div className="shrink-0 bg-[#0f0f0f] border-b border-[#1a1a1a] px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-start gap-2">
          <span className="text-[#444] text-xs shrink-0 mt-0.5">Idea:</span>
          <p className="text-[#666] text-xs leading-relaxed line-clamp-2">{startupIdea}</p>
        </div>
      </div>

      {/* Rotating tip */}
      <div className="shrink-0 bg-[#E8A838]/5 border-b border-[#E8A838]/10 px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-start gap-2">
          <span className="text-[#E8A838] text-xs shrink-0 mt-0.5">Tip</span>
          <p className="text-[#888] text-xs leading-relaxed">{TIPS[tipIndex]}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col gap-4">

          {/* Phase + question meta */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E8A838] uppercase tracking-widest">
              Phase {q.phase} — {q.phaseTitle}
            </span>
            <span className="text-xs text-[#444]">{current + 1} of {TOTAL}</span>
          </div>

          {/* Question card */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 sm:p-5">
            <p className="text-white text-sm sm:text-base leading-relaxed">{q.question}</p>

            {q.hint && (
              <div className="mt-3">
                <button
                  onClick={() => setShowHint((v) => !v)}
                  className="text-xs text-[#555] hover:text-[#E8A838] transition flex items-center gap-1"
                >
                  <span>{showHint ? "▾" : "▸"}</span> How to answer this
                </button>
                {showHint && (
                  <p className="mt-2 text-xs text-[#888] leading-relaxed border-l-2 border-[#E8A838]/30 pl-3">
                    {q.hint}
                  </p>
                )}
              </div>
            )}

            {q.example && (
              <div className="mt-2">
                <button
                  onClick={() => setShowExample((v) => !v)}
                  className="text-xs text-[#555] hover:text-[#666] transition flex items-center gap-1"
                >
                  <span>{showExample ? "▾" : "▸"}</span> See an example answer
                </button>
                {showExample && (
                  <p className="mt-2 text-xs text-[#666] leading-relaxed italic border-l-2 border-[#333] pl-3">
                    {q.example}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Answer textarea */}
          <div>
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={flags[current]}
              rows={6}
              placeholder={flags[current] ? "Flagged — moving on" : "Your answer…"}
              className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none transition resize-none ${
                flags[current]
                  ? "border-amber-800/50 opacity-50 cursor-not-allowed"
                  : "border-[#2a2a2a] focus:border-[#E8A838]"
              }`}
            />
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className={`text-xs ${charCount < MIN_CHARS && !flags[current] ? "text-red-500/70" : "text-[#444]"}`}>
                {wordCount}w · {charCount}ch
                {charCount < MIN_CHARS && !flags[current] && ` · ${MIN_CHARS - charCount} more`}
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={flags[current]}
                  onChange={toggleFlag}
                  className="accent-amber-500 w-3 h-3"
                />
                <span className={`text-xs transition ${flags[current] ? "text-amber-400" : "text-[#555] group-hover:text-[#888]"}`}>
                  Haven't thought about this
                </span>
              </label>
            </div>
          </div>

          {/* Flag warning */}
          {flagCount >= MAX_FLAGS && (
            <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg px-4 py-3">
              <p className="text-amber-400 text-xs">
                {flagCount} questions flagged as unanswered. This will significantly lower your score. Consider providing even a rough estimate.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              disabled={current === 0}
              className="px-4 py-2.5 rounded-lg text-sm border border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#444] transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canAdvance}
              className="flex-1 bg-[#E8A838] text-black font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-[#d4962e] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLast ? "Pay & Generate Report →" : "Next →"}
            </button>
          </div>

          {isLast && (
            <p className="text-center text-xs text-[#444]">
              Payment of ₹999 required to generate your report
            </p>
          )}

          {!isLast && (
            <p className="text-center text-xs text-[#333]">
              Ctrl/Cmd + Enter to advance
            </p>
          )}

          {/* Progress summary */}
          <div className="flex items-center justify-center gap-4 text-xs text-[#444] pt-2 border-t border-[#111]">
            <span>{answers.filter((a) => (a ?? "").trim().length >= MIN_CHARS).length} answered</span>
            <span>·</span>
            <span>{flagCount} flagged</span>
            <span>·</span>
            <span>
              {TOTAL - answers.filter((a) => (a ?? "").trim().length >= MIN_CHARS).length - flagCount} remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
