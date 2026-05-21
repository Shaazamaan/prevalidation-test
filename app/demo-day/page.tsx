"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type DemoDayEntry = {
  id: string;
  email: string;
  founderName: string;
  startupName: string;
  oneLiner: string;
  videoUrl?: string;
  readinessScore?: number;
  votes: number;
  submittedAt: number;
  month: string;
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function fmtMonth(m: string) {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function DemoDayPage() {
  const { data: authSession } = useSession();
  const [entries, setEntries] = useState<DemoDayEntry[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ startupName: "", oneLiner: "", videoUrl: "" });
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/demo-day?month=${month}`)
      .then((r) => r.json())
      .then((d) => { setEntries(d.entries ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month]);

  const submit = async () => {
    if (!form.startupName.trim() || !form.oneLiner.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/demo-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setEntries((prev) => [data.entry, ...prev]);
      setShowForm(false);
      setForm({ startupName: "", oneLiner: "", videoUrl: "" });
    } else {
      setMsg(data.error ?? "Error submitting");
      setTimeout(() => setMsg(""), 3000);
    }
    setSubmitting(false);
  };

  const vote = async (id: string) => {
    if (voted.has(id)) return;
    const res = await fetch("/api/demo-day", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setVoted((prev) => new Set(Array.from(prev).concat(id)));
      setEntries((prev) => prev.map((e) => e.id === id ? { ...e, votes: e.votes + 1 } : e));
    }
  };

  const myEntry = entries.find((e) => e.email === authSession?.user?.email);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-4 py-20 max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-2">Devbridge</p>
        <h1 className="text-3xl font-bold mb-2">Demo Day</h1>
        <p className="text-[#666] text-sm">Submit your startup each month. Community votes for the best ideas.</p>
      </div>

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const [y, m] = month.split("-").map(Number);
              const prev = new Date(y, m - 2);
              setMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`);
            }}
            className="text-[#444] hover:text-white transition text-xs px-2 py-1 border border-[#222] rounded"
          >←</button>
          <span className="text-sm text-white font-medium">{fmtMonth(month)}</span>
          <button
            onClick={() => {
              const [y, m] = month.split("-").map(Number);
              const next = new Date(y, m);
              const nm = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
              if (nm <= currentMonth()) setMonth(nm);
            }}
            className="text-[#444] hover:text-white transition text-xs px-2 py-1 border border-[#222] rounded"
          >→</button>
        </div>

        {authSession?.user && !myEntry && month === currentMonth() && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#E8A838] text-black text-sm font-semibold rounded-lg hover:bg-[#f0b84a] transition"
          >
            Submit Your Startup
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-6 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Submit for {fmtMonth(month)}</h3>
          <div>
            <label className="text-xs text-[#666] block mb-1">Startup name</label>
            <input
              value={form.startupName}
              onChange={(e) => setForm((f) => ({ ...f, startupName: e.target.value }))}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <label className="text-xs text-[#666] block mb-1">One-liner (max 100 chars)</label>
            <input
              value={form.oneLiner}
              maxLength={100}
              onChange={(e) => setForm((f) => ({ ...f, oneLiner: e.target.value }))}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
              placeholder="We help X do Y without Z"
            />
            <p className="text-[10px] text-[#444] mt-1">{form.oneLiner.length}/100</p>
          </div>
          <div>
            <label className="text-xs text-[#666] block mb-1">Demo video URL (optional)</label>
            <input
              value={form.videoUrl}
              onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
              placeholder="https://youtube.com/..."
            />
          </div>
          {msg && <p className="text-red-400 text-xs">{msg}</p>}
          <div className="flex gap-3">
            <button
              onClick={submit}
              disabled={submitting || !form.startupName.trim() || !form.oneLiner.trim()}
              className="px-4 py-2 bg-[#E8A838] text-black text-sm font-semibold rounded-lg hover:bg-[#f0b84a] transition disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-[#555] hover:text-white transition">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[#444] text-sm">Loading…</p>
      ) : entries.length === 0 ? (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-10 text-center">
          <p className="text-[#444] text-sm">No entries yet for {fmtMonth(month)}.</p>
          {month === currentMonth() && authSession?.user && (
            <button onClick={() => setShowForm(true)} className="mt-4 text-xs text-[#E8A838] hover:underline">Be the first to submit →</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <div key={entry.id} className="bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-xl p-5 flex items-start gap-4">
              <div className="text-2xl font-bold text-[#333] w-8 text-center shrink-0">#{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{entry.startupName}</p>
                <p className="text-[#666] text-sm mt-0.5">{entry.oneLiner}</p>
                <p className="text-[#333] text-xs mt-1">by {entry.founderName}</p>
                {entry.videoUrl && (
                  <a href={entry.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#E8A838] hover:underline mt-1 inline-block">Watch demo →</a>
                )}
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <button
                  onClick={() => vote(entry.id)}
                  disabled={!authSession?.user || voted.has(entry.id) || entry.email === authSession?.user?.email}
                  className="text-lg disabled:opacity-30 hover:scale-110 transition"
                  title={!authSession?.user ? "Sign in to vote" : voted.has(entry.id) ? "Already voted" : "Vote"}
                >
                  🔥
                </button>
                <span className="text-xs text-[#666]">{entry.votes}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
