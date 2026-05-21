"use client";

import { useState } from "react";

interface NPSSurveyProps {
  email: string;
  tool: string;
  onDismiss: () => void;
}

export default function NPSSurvey({ email, tool, onDismiss }: NPSSurveyProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [thanked, setThanked] = useState(false);

  const handleSubmit = async () => {
    if (selected === null || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/nps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: selected, comment, tool, email }),
      });
      setThanked(true);
      setTimeout(onDismiss, 2000);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-[#111] border border-[#222] rounded-2xl shadow-2xl p-5">
        {thanked ? (
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="text-[#E8A838] text-lg mb-1">Thank you!</div>
              <p className="text-[#888] text-sm">Your feedback helps us improve.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2 mb-4">
              <p className="text-white text-sm font-medium leading-snug flex-1">
                How likely are you to recommend Devbridge to another founder?
              </p>
              <button
                onClick={onDismiss}
                className="text-[#444] hover:text-[#888] transition shrink-0 mt-0.5"
                aria-label="Dismiss"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-[#444] text-xs mb-3">0 = Not at all &nbsp;&mdash;&nbsp; 10 = Definitely</p>

            {/* Score buttons */}
            <div className="flex gap-1.5 flex-wrap mb-4">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-medium transition border ${
                    selected === i
                      ? "bg-[#E8A838] border-[#E8A838] text-black"
                      : "bg-[#0d0d0d] border-[#222] text-[#888] hover:border-[#E8A838] hover:text-white"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              placeholder="Optional comment — what can we do better?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition resize-none mb-4"
            />

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={selected === null || submitting}
                className="bg-[#E8A838] text-black text-xs font-medium rounded-lg px-4 py-2 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
              <button
                onClick={onDismiss}
                className="text-[#555] text-xs hover:text-[#888] transition"
              >
                Maybe later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
