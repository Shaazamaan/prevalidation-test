"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  existingStatus: "pending" | "banned" | null;
  defaultName: string;
  email: string;
};

export default function AgentRegisterForm({ existingStatus, defaultName, email }: Props) {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (existingStatus === "pending" || submitted) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-white text-xl font-semibold mb-2">Application Submitted!</h2>
          <p className="text-[#666] text-sm">We'll review your application and notify you. Once approved, you'll get full dashboard access.</p>
          <Link href="/" className="block mt-6 text-sm text-[#555] hover:text-white transition">← Back to Devbridge</Link>
        </div>
      </main>
    );
  }

  if (existingStatus === "banned") {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-white text-xl font-semibold mb-2">Account Suspended</h2>
          <p className="text-[#666] text-sm">Your agent account has been suspended. Contact us if you believe this is an error.</p>
        </div>
      </main>
    );
  }

  const handleSubmit = async () => {
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/agent/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), bio: bio.trim() }),
      });
      const d = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) {
        setError(d.error ?? "Failed to register. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch { setError("Network error. Please try again."); }
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-16 pt-8 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-[#555] hover:text-white text-sm transition block mb-8">← Back</Link>
        <h1 className="text-white text-2xl font-semibold mb-1">Become a Devbridge Agent</h1>
        <p className="text-[#666] text-sm mb-8 leading-relaxed">
          Agents bring founders to Devbridge and earn through exclusive discount coupons (up to 40% off) for their clients.
          Share your invite link, track your clients, and grow your network.
        </p>
        <div className="bg-[#111] border border-[#222] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-[#555] text-xs mb-1.5 block">Full Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-[#0d0d0d] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
            />
          </div>
          <div>
            <label className="text-[#555] text-xs mb-1.5 block">Phone Number *</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 99999 99999"
              className="w-full bg-[#0d0d0d] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
            />
          </div>
          <div>
            <label className="text-[#555] text-xs mb-1.5 block">Tell us about yourself (optional)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Community leader, startup ecosystem, etc."
              className="w-full bg-[#0d0d0d] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition resize-none"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#E8A838] hover:bg-[#d4962e] text-black font-semibold py-3 rounded-xl text-sm transition disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Apply to Become an Agent"}
          </button>
          <p className="text-[#444] text-xs text-center">Applying as: {email}</p>
        </div>
      </div>
    </main>
  );
}
