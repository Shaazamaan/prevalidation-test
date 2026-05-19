"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FounderForm() {
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
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
        body: JSON.stringify({ founderName: name.trim(), startupIdea: idea.trim() }),
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
        <label className="block text-sm text-[#888] mb-1.5">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
        />
      </div>
      <div>
        <label className="block text-sm text-[#888] mb-1.5">Startup Idea</label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value.slice(0, 400))}
          placeholder="Describe your idea in plain language — what problem it solves and for whom"
          required
          rows={5}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition resize-none"
        />
        <p className="text-right text-xs text-[#555] mt-1">{idea.length}/400</p>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || !name.trim() || !idea.trim()}
        className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-lg text-sm hover:bg-[#d4962e] transition disabled:opacity-40"
      >
        {loading ? "Starting…" : "Begin Interrogation →"}
      </button>
    </form>
  );
}
