"use client";

import { useState } from "react";
import type { DNAResult } from "@/lib/db";

const QUESTIONS = [
  // Visionary (index 0-2)
  "I often think 5-10 years ahead about where markets are heading",
  "I get most excited by discovering what's possible, not what's practical",
  "I'd rather paint the big picture and let others figure out the details",
  // Executor (index 3-5)
  "I break big goals into daily tasks and track them obsessively",
  "I feel uncomfortable when there's no clear plan or timeline",
  "I get energy from shipping things, not from planning them",
  // Networker (index 6-8)
  "My best opportunities have come from who I knew, not what I knew",
  "I instinctively think about who can help me with any new challenge",
  "I find it easy to ask for favors and introductions",
  // Builder (index 9-11)
  "I prefer to prototype and test rather than debate and analyze",
  "I have strong opinions about product quality and user experience",
  "I get frustrated when decisions are made without user data",
];

const ARCHETYPES = {
  Visionary: {
    emoji: "🔭",
    color: "#9B6EF3",
    description:
      "You see the future before others do. Your superpower is inspiring belief in an idea that doesn't exist yet. Risk: you may lose interest in execution. Pair with an Executor.",
    pair: "Executor",
  },
  Executor: {
    emoji: "⚡",
    color: "#E8A838",
    description:
      "You turn plans into reality. Your superpower is shipping. Risk: you may optimize locally instead of questioning direction. Pair with a Visionary.",
    pair: "Visionary",
  },
  Networker: {
    emoji: "🤝",
    color: "#3BE0A0",
    description:
      "You build the team and the network. Your superpower is unlocking doors. Risk: you may avoid hard product decisions. Pair with a Builder.",
    pair: "Builder",
  },
  Builder: {
    emoji: "🔨",
    color: "#E85B38",
    description:
      "You build what users actually want. Your superpower is product instinct. Risk: you may under-invest in distribution. Pair with a Networker.",
    pair: "Networker",
  },
};

const SCALE_LABELS = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];

export default function DNAQuiz({ initialResult }: { initialResult: DNAResult | null }) {
  const [result, setResult] = useState<DNAResult | null>(initialResult);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(12).fill(0));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [retaking, setRetaking] = useState(false);

  const showQuiz = !result || retaking;

  const handleAnswer = async (value: number) => {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);

    if (step < 11) {
      setStep(step + 1);
    } else {
      // Last question — submit
      setSubmitting(true);
      setError("");
      try {
        const res = await fetch("/api/dna", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: next }),
        });
        const data = await res.json() as { result?: DNAResult; error?: string };
        if (data.result) {
          setResult(data.result);
          setRetaking(false);
        } else {
          setError(data.error ?? "Something went wrong");
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleRetake = () => {
    setAnswers(Array(12).fill(0));
    setStep(0);
    setError("");
    setRetaking(true);
  };

  if (showQuiz) {
    const progress = ((step) / 12) * 100;
    return (
      <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-1">Startup DNA</p>
          <h1 className="font-crimson text-2xl sm:text-3xl font-semibold text-white mb-2">
            What kind of founder are you?
          </h1>
          <p className="text-[#555] text-sm mb-8">12 questions · 2 minutes · discover your archetype</p>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs text-[#444] mb-2">
              <span>Question {step + 1} of 12</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E8A838] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {submitting ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#555] text-sm">Analyzing your answers…</p>
            </div>
          ) : (
            <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6 sm:p-8">
              <p className="text-white text-lg sm:text-xl font-medium mb-8 leading-relaxed">
                {QUESTIONS[step]}
              </p>

              <div className="space-y-3">
                {SCALE_LABELS.map((label, i) => {
                  const value = i + 1;
                  const isSelected = answers[step] === value;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(value)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-[#E8A838] bg-[#E8A838]/10 text-[#E8A838]"
                          : "border-[#1a1a1a] text-[#555] hover:border-[#333] hover:text-white"
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isSelected ? "border-[#E8A838] bg-[#E8A838] text-black" : "border-[#333] text-[#444]"
                      }`}>
                        {value}
                      </span>
                      <span className="text-sm">{label}</span>
                    </button>
                  );
                })}
              </div>

              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="mt-6 text-xs text-[#444] hover:text-white transition"
                >
                  ← Back
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    );
  }

  // Result view
  const archInfo = ARCHETYPES[result.archetype];
  const shareText = encodeURIComponent(
    `My Startup DNA: ${result.archetype}! Find yours on Devbridge`
  );
  const waUrl = `https://wa.me/?text=${shareText}`;
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://devbridge.in/dna")}&summary=${shareText}`;

  const scoreEntries = [
    { label: "Visionary", score: result.scores.visionary, color: ARCHETYPES.Visionary.color },
    { label: "Executor", score: result.scores.executor, color: ARCHETYPES.Executor.color },
    { label: "Networker", score: result.scores.networker, color: ARCHETYPES.Networker.color },
    { label: "Builder", score: result.scores.builder, color: ARCHETYPES.Builder.color },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-1">Your Startup DNA</p>
        <h1 className="font-crimson text-2xl sm:text-3xl font-semibold text-white mb-8">
          You&apos;re a {result.archetype}
        </h1>

        {/* Main result card */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6 sm:p-8 mb-6 text-center">
          <div className="text-7xl mb-4">{archInfo.emoji}</div>
          <h2 className="font-crimson text-3xl font-semibold text-white mb-3">{result.archetype}</h2>
          <p className="text-[#888] text-sm leading-relaxed max-w-md mx-auto">{archInfo.description}</p>
          <div
            className="mt-4 inline-block px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${archInfo.color}20`, color: archInfo.color }}
          >
            Best paired with a {archInfo.pair}
          </div>
        </div>

        {/* Score breakdown */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 mb-6">
          <p className="text-xs text-[#444] uppercase tracking-widest mb-4">Score breakdown</p>
          <div className="space-y-3">
            {scoreEntries.sort((a, b) => b.score - a.score).map(({ label, score, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#888]">{label}</span>
                  <span className="text-[#555]">{score}/15</span>
                </div>
                <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(score / 15) * 100}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Share card */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 mb-6">
          <p className="text-xs text-[#444] uppercase tracking-widest mb-4">Share your DNA</p>
          <div className="flex gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-sm font-medium hover:bg-[#25D366]/20 transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <a
              href={liUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0A66C2]/10 border border-[#0A66C2]/20 text-[#0A66C2] text-sm font-medium hover:bg-[#0A66C2]/20 transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          </div>
        </div>

        <button
          onClick={handleRetake}
          className="w-full py-3 border border-[#1a1a1a] rounded-xl text-[#555] text-sm hover:text-white hover:border-[#333] transition"
        >
          Retake quiz
        </button>

        {result.takenAt && (
          <p className="text-center text-[#333] text-xs mt-4">
            Taken {new Date(result.takenAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>
    </main>
  );
}
