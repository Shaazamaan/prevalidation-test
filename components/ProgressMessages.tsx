"use client";

import { useState, useEffect } from "react";

const MESSAGES: Record<string, string[]> = {
  advisor: [
    "Reading your intake responses…",
    "Analysing founder readiness…",
    "Evaluating market opportunity…",
    "Scoring 6 viability dimensions…",
    "Routing to your pathway…",
    "Writing your recommendations…",
    "Finalising your report…",
  ],
  pitchdeck: [
    "Reading your pitch deck…",
    "Identifying your startup track…",
    "Scoring investment dimensions…",
    "Evaluating grant readiness…",
    "Analysing investor readiness…",
    "Writing slide-by-slide feedback…",
    "Finalising scores and next steps…",
  ],
  readiness: [
    "Reading your answers…",
    "Checking for contradictions…",
    "Stress-testing your assumptions…",
    "Scoring each phase…",
    "Writing your verdict…",
  ],
};

interface Props {
  tool: "readiness" | "advisor" | "pitchdeck";
}

export default function ProgressMessages({ tool }: Props) {
  const messages = MESSAGES[tool];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
      <p className="font-crimson text-2xl text-white mb-3">{messages[index]}</p>
      <div className="flex gap-1.5 mt-2">
        {messages.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              i === index ? "bg-[#E8A838]" : "bg-[#333]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
