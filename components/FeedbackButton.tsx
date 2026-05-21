"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

type FeedbackType = "bug" | "feature" | "other";

export default function FeedbackButton() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSubmit = async () => {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          body: body.trim(),
          page: window.location.pathname,
          email: session?.user?.email ?? undefined,
        }),
      });
      setBody("");
      setType("bug");
      setOpen(false);
      setToast(true);
      setTimeout(() => setToast(false), 3500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Tab trigger */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50" ref={panelRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center justify-center bg-[#E8A838] text-black font-medium text-xs rounded-l-lg py-3 px-2 shadow-lg hover:opacity-90 transition"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", minHeight: "80px" }}
          aria-label="Open feedback panel"
        >
          Feedback
        </button>

        {/* Slide-in panel */}
        <div
          className={`absolute right-full top-1/2 -translate-y-1/2 w-72 bg-[#111] border border-[#222] rounded-xl shadow-2xl p-4 transition-all duration-200 ${
            open ? "opacity-100 pointer-events-auto translate-x-0" : "opacity-0 pointer-events-none translate-x-4"
          }`}
          style={{ transformOrigin: "right center" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-medium">Send Feedback</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-[#444] hover:text-[#888] transition"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Type */}
          <div className="mb-3">
            <label className="text-[10px] text-[#444] block mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FeedbackType)}
              className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E8A838] transition"
            >
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Body */}
          <div className="mb-4">
            <label className="text-[10px] text-[#444] block mb-1.5">
              Message <span className="text-[#333]">({body.length}/500)</span>
            </label>
            <textarea
              placeholder="Tell us what's on your mind..."
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 500))}
              rows={4}
              className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!body.trim() || submitting}
            className="w-full bg-[#E8A838] text-black text-xs font-medium rounded-lg px-3 py-2 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-[#111] border border-[#333] text-white text-xs rounded-xl px-4 py-3 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          Thanks! We read every message.
        </div>
      )}
    </>
  );
}
