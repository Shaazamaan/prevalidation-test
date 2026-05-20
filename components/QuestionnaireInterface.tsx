"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/lib/questions";

type Props = {
  sessionId: string;
  founderName: string;
  startupIdea: string;
};

const TOTAL = QUESTIONS.length;

export default function QuestionnaireInterface({ sessionId, founderName, startupIdea }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(TOTAL).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [current]);

  const q = QUESTIONS[current];
  const isLast = current === TOTAL - 1;
  const progress = ((current + 1) / TOTAL) * 100;

  const handleNext = () => {
    if (!answers[current].trim()) return;
    if (isLast) {
      handleSubmit();
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

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload = QUESTIONS.map((q, i) => ({
        question: q.question,
        answer: answers[i] || "(no answer)",
      }));

      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers: payload }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push(`/report/${sessionId}`);
    } catch {
      setError("Connection error. Please check your internet and try again.");
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="font-crimson text-2xl text-white mb-2">Evaluating your answers…</p>
          <p className="text-[#666] text-sm">This takes 20–40 seconds. Please don't close this tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-5 py-3 border-b border-[#1a1a1a] bg-[#0d0d0d] flex items-center justify-between">
        <span className="font-crimson text-lg text-white font-semibold">Founder Readiness Check</span>
        <span className="text-sm text-[#666]">{founderName}</span>
      </header>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#1a1a1a]">
        <div
          className="h-1 bg-[#E8A838] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Phase + question counter */}
      <div className="shrink-0 px-5 py-3 flex items-center justify-between max-w-3xl w-full mx-auto">
        <span className="text-xs font-semibold text-[#E8A838] uppercase tracking-widest">
          Phase {q.phase} — {q.phaseTitle}
        </span>
        <span className="text-xs text-[#555]">{current + 1} / {TOTAL}</span>
      </div>

      {/* Question + answer */}
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-5 pb-6">
        <div className="bg-[#111] border border-[#222] rounded-xl p-5 mb-4">
          <p className="text-white text-base leading-relaxed">{q.question}</p>
        </div>

        <textarea
          ref={textareaRef}
          value={answers[current]}
          onChange={(e) => {
            const updated = [...answers];
            updated[current] = e.target.value;
            setAnswers(updated);
          }}
          onKeyDown={handleKeyDown}
          rows={6}
          placeholder="Your answer…"
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] resize-none transition"
        />

        {error && (
          <p className="text-red-400 text-sm mt-3">{error}</p>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleBack}
            disabled={current === 0}
            className="px-4 py-2.5 rounded-lg text-sm border border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#444] transition disabled:opacity-30"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!answers[current].trim()}
            className="flex-1 bg-[#E8A838] text-black font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-[#d4962e] transition disabled:opacity-40"
          >
            {isLast ? "Submit & Generate Report" : "Next Question"}
          </button>
        </div>

        <p className="text-center text-xs text-[#333] mt-3">
          {isLast ? "Ctrl/Cmd+Enter to submit" : "Ctrl/Cmd+Enter for next"}
        </p>
      </div>
    </div>
  );
}
