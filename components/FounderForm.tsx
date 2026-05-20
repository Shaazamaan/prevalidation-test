"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STARTUP_TYPES = [
  "SaaS / Software / Tech",
  "E-commerce / Physical Product",
  "Marketplace / Platform",
  "Service / Agency / Consulting",
  "Food / Beverage / FMCG",
  "Health / Medical / Wellness",
  "Fintech / Finance / Insurance",
  "Education / EdTech",
  "Other",
];

export default function FounderForm() {
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [startupType, setStartupType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          founderName: name.trim(),
          startupIdea: idea.trim(),
          startupType: startupType || "Not specified",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      const { sessionId } = await res.json();
      router.push(`/chat/${sessionId}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-[#888] mb-1.5">Your Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name is fine"
          required
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
        />
      </div>

      <div>
        <label className="block text-sm text-[#888] mb-1.5">Startup Type</label>
        <select
          value={startupType}
          onChange={(e) => setStartupType(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A838] transition"
          style={{ color: startupType ? "white" : "#666" }}
        >
          <option value="" disabled>Select category…</option>
          {STARTUP_TYPES.map((t) => (
            <option key={t} value={t} style={{ color: "white" }}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-[#888] mb-1.5">Startup Idea</label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value.slice(0, 500))}
          placeholder="What problem does it solve, and for whom? Be specific."
          required
          rows={4}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition resize-none"
        />
        <p className="text-right text-xs text-[#555] mt-1">{idea.length}/500</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !name.trim() || !idea.trim()}
        className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-lg text-sm hover:bg-[#d4962e] transition disabled:opacity-40"
      >
        {loading ? "Starting…" : "Begin the Interrogation →"}
      </button>

      <p className="text-center text-xs text-[#444]">
        Takes 25–35 minutes. Your answers are stored securely and never shared.
      </p>
    </form>
  );
}
