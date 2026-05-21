"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type FounderCircle = {
  id: string;
  name: string;
  sector: string;
  stage: string;
  members: string[];
  maxMembers: number;
  createdAt: number;
};

const STAGES = ["idea", "pre-revenue", "early-revenue", "scaling"];
const SECTORS = ["SaaS", "Fintech", "Edtech", "Healthtech", "D2C", "Marketplace", "B2B", "Other"];

const BLANK = { name: "", sector: "SaaS", stage: "idea", maxMembers: "8" };

export default function CirclesPage() {
  const { data: authSession } = useSession();
  const [circles, setCircles] = useState<FounderCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!authSession?.user) { setLoading(false); return; }
    fetch("/api/circles")
      .then((r) => r.json())
      .then((d) => { setCircles(d.circles ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authSession]);

  const create = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), sector: form.sector, stage: form.stage, maxMembers: parseInt(form.maxMembers) || 8 }),
    });
    const data = await res.json();
    if (res.ok) {
      setCircles((prev) => [data.circle, ...prev]);
      setShowForm(false);
      setForm({ ...BLANK });
    } else {
      setMsg(data.error ?? "Error creating circle");
      setTimeout(() => setMsg(""), 3000);
    }
    setSubmitting(false);
  };

  const join = async (circleId: string) => {
    setJoining(circleId);
    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circleId }),
    });
    if (res.ok) {
      setCircles((prev) => prev.map((c) => c.id === circleId
        ? { ...c, members: [...c.members, authSession!.user!.email!] }
        : c
      ));
    } else {
      const d = await res.json();
      setMsg(d.error ?? "Could not join");
      setTimeout(() => setMsg(""), 3000);
    }
    setJoining(null);
  };

  if (!authSession?.user) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#555] mb-4">Sign in to view and join founder circles.</p>
          <a href="/login" className="text-[#E8A838] text-sm hover:underline">Sign in →</a>
        </div>
      </main>
    );
  }

  const myEmail = authSession.user.email!;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-4 py-20 max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-2">Devbridge</p>
          <h1 className="text-3xl font-bold mb-2">Founder Circles</h1>
          <p className="text-[#666] text-sm">Small accountability circles of founders at the same stage.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-[#E8A838] text-black text-sm font-semibold rounded-lg hover:bg-[#f0b84a] transition shrink-0">
          Create Circle
        </button>
      </div>

      {msg && <p className="text-red-400 text-xs mb-4">{msg}</p>}

      {showForm && (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">New Circle</h3>
          <div>
            <label className="text-xs text-[#666] block mb-1">Circle name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
              placeholder="e.g. SaaS Founders — Pre-revenue" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[#666] block mb-1">Sector</label>
              <select value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50">
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-1">Stage</label>
              <select value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50">
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-1">Max size</label>
              <input type="number" min={2} max={20} value={form.maxMembers} onChange={(e) => setForm((f) => ({ ...f, maxMembers: e.target.value }))}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={create} disabled={submitting || !form.name.trim()}
              className="px-4 py-2 bg-[#E8A838] text-black text-sm font-semibold rounded-lg hover:bg-[#f0b84a] transition disabled:opacity-50">
              {submitting ? "Creating…" : "Create"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-[#555] hover:text-white transition">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[#444] text-sm">Loading…</p>
      ) : circles.length === 0 ? (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-10 text-center">
          <p className="text-[#444] text-sm mb-2">No circles yet.</p>
          <button onClick={() => setShowForm(true)} className="text-xs text-[#E8A838] hover:underline">Start the first one →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {circles.map((c) => {
            const isMember = c.members.includes(myEmail);
            const isFull = c.members.length >= c.maxMembers;
            return (
              <div key={c.id} className="bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-xl p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{c.name}</p>
                  <p className="text-[#444] text-xs mt-0.5">{c.sector} · {c.stage}</p>
                  <p className="text-[#333] text-xs mt-1">{c.members.length} / {c.maxMembers} members</p>
                </div>
                {isMember ? (
                  <span className="text-xs text-green-400 border border-green-800/40 px-3 py-1.5 rounded-lg shrink-0">Joined ✓</span>
                ) : isFull ? (
                  <span className="text-xs text-[#444] border border-[#222] px-3 py-1.5 rounded-lg shrink-0">Full</span>
                ) : (
                  <button onClick={() => join(c.id)} disabled={joining === c.id}
                    className="px-4 py-1.5 bg-[#E8A838]/10 text-[#E8A838] border border-[#E8A838]/30 text-xs font-medium rounded-lg hover:bg-[#E8A838]/20 transition disabled:opacity-50 shrink-0">
                    {joining === c.id ? "Joining…" : "Join"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
