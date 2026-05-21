"use client";

import { useState } from "react";

type BuddyRequest = {
  id: string;
  email: string;
  name: string;
  stage: string;
  sector: string;
  lookingFor: string;
  bio: string;
  createdAt: number;
  matchedWith?: string;
};

const STAGES = ["idea", "mvp", "early_revenue", "scaling", "pivot"];

const BLANK = { name: "", stage: "idea", sector: "", lookingFor: "", bio: "" };

export default function BuddyMatcher({
  myRequest: initialRequest,
  buddyProfile: initialBuddy,
  totalWaiting,
  userEmail,
  userName,
}: {
  myRequest: BuddyRequest | null;
  buddyProfile: BuddyRequest | null;
  totalWaiting: number;
  userEmail: string;
  userName: string;
}) {
  const [myRequest, setMyRequest] = useState<BuddyRequest | null>(initialRequest);
  const [buddyProfile] = useState<BuddyRequest | null>(initialBuddy);
  const [form, setForm] = useState({ ...BLANK, name: userName });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [withdrawn, setWithdrawn] = useState(false);

  const isMatched = myRequest?.matchedWith && myRequest.matchedWith !== "withdrawn";
  const isPending = myRequest && !isMatched && !withdrawn;

  const joinBuddy = async () => {
    if (!form.name.trim() || !form.sector.trim() || !form.lookingFor.trim()) {
      setError("Name, sector, and what you're looking for are required.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/buddy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json() as { request?: BuddyRequest; error?: string };
    if (d.request) {
      setMyRequest(d.request);
    } else {
      setError(d.error ?? "Failed to submit request.");
    }
    setSaving(false);
  };

  const withdraw = async () => {
    await fetch("/api/buddy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "withdraw" }),
    });
    setMyRequest(null);
    setWithdrawn(true);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-1">Community</p>
          <h1 className="font-crimson text-2xl sm:text-3xl font-semibold text-white mb-1">Buddy System</h1>
          <p className="text-[#555] text-xs">Find an accountability buddy matched from the Devbridge founder community.</p>
        </div>

        {/* Stats */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
          <span className="text-[#666] text-xs">{totalWaiting} founder{totalWaiting !== 1 ? "s" : ""} looking for an accountability buddy</span>
          <span className="text-[10px] text-[#333]">Admin reviews matches weekly</span>
        </div>

        {/* MATCHED STATE */}
        {isMatched && buddyProfile && (
          <div>
            <div className="bg-[#111] border border-[#E8A838]/30 rounded-2xl p-5 mb-4">
              <p className="text-[#E8A838] text-xs font-medium mb-1">You have a buddy!</p>
              <h2 className="text-white text-lg font-semibold mb-3">{buddyProfile.name}</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-[10px] text-[#444] mb-0.5">Stage</p>
                  <p className="text-white text-xs">{buddyProfile.stage}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#444] mb-0.5">Sector</p>
                  <p className="text-white text-xs">{buddyProfile.sector}</p>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[10px] text-[#444] mb-0.5">Looking for</p>
                <p className="text-[#888] text-xs">{buddyProfile.lookingFor}</p>
              </div>
              <div className="mb-4">
                <p className="text-[10px] text-[#444] mb-0.5">About</p>
                <p className="text-[#888] text-xs">{buddyProfile.bio}</p>
              </div>
              <a
                href="/match/messages"
                className="inline-block bg-[#E8A838] text-black text-xs font-medium px-4 py-2 rounded-lg hover:bg-[#d4962e] transition"
              >
                Message your buddy
              </a>
              <p className="text-[#333] text-[10px] mt-2">Connect via Devbridge match messages or reach out on LinkedIn.</p>
            </div>
          </div>
        )}

        {/* PENDING STATE */}
        {isPending && !withdrawn && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] px-2 py-0.5 rounded-full border text-[#E8A838] border-[#E8A838]/40">Pending match</span>
            </div>
            <p className="text-white text-sm font-medium mb-1">Waiting for a match</p>
            <p className="text-[#555] text-xs mb-4">Admin reviews and matches founders every week. You'll be notified when you're matched.</p>
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3 mb-4">
              <p className="text-white text-xs font-medium">{myRequest.name}</p>
              <p className="text-[#555] text-xs">{myRequest.stage} · {myRequest.sector}</p>
              <p className="text-[#666] text-xs mt-1 line-clamp-2">{myRequest.lookingFor}</p>
            </div>
            <button
              onClick={withdraw}
              className="border border-[#333] text-[#555] text-xs px-3 py-2 rounded-lg hover:border-red-800/50 hover:text-red-400 transition"
            >
              Withdraw request
            </button>
          </div>
        )}

        {/* JOIN FORM — no request yet */}
        {!myRequest && !withdrawn && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5">
            <p className="text-sm font-medium text-white mb-4">Join the Buddy System</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-[#444] block mb-1">Your name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Rahul Sharma"
                  className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#444] block mb-1">Startup stage</label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                  className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {STAGES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-[10px] text-[#444] block mb-1">Sector / industry *</label>
              <input
                value={form.sector}
                onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                placeholder="SaaS, EdTech, HealthTech, D2C..."
                className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50"
              />
            </div>
            <div className="mb-3">
              <label className="text-[10px] text-[#444] block mb-1">What are you looking for in a buddy? *</label>
              <textarea
                value={form.lookingFor}
                onChange={(e) => setForm((f) => ({ ...f, lookingFor: e.target.value }))}
                rows={2}
                placeholder="Weekly check-ins, honest feedback, someone to celebrate wins and talk through blockers..."
                className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50 resize-none"
              />
            </div>
            <div className="mb-4">
              <label className="text-[10px] text-[#444] block mb-1">About you (2–3 lines)</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={2}
                placeholder="Building a B2B SaaS for SMEs. 2 years in, post-revenue. Ex-consultant."
                className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50 resize-none"
              />
            </div>
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <button
              onClick={joinBuddy}
              disabled={saving}
              className="w-full py-2.5 bg-[#E8A838] text-black text-xs font-medium rounded-lg hover:bg-[#d4962e] transition disabled:opacity-50"
            >
              {saving ? "Submitting…" : "Join Buddy System"}
            </button>
            <p className="text-[#333] text-[10px] text-center mt-2">Admin reviews matches weekly and notifies you by email.</p>
          </div>
        )}

        {/* Withdrawn confirmation */}
        {withdrawn && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 text-center">
            <p className="text-[#666] text-sm">Request withdrawn.</p>
            <button
              onClick={() => { setWithdrawn(false); setMyRequest(null); }}
              className="mt-3 text-xs text-[#E8A838] hover:underline"
            >
              Join again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
