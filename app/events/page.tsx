"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type PitchCompetition = {
  id: string;
  name: string;
  organizer: string;
  deadline: number;
  eventDate?: number;
  prize?: string;
  location: string;
  url: string;
  sector?: string;
  stage?: string;
  addedAt: number;
};

const BLANK = { name: "", organizer: "", deadline: "", eventDate: "", prize: "", location: "Remote", url: "", sector: "", stage: "" };

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysLeft(ms: number) {
  const d = Math.ceil((ms - Date.now()) / (1000 * 60 * 60 * 24));
  if (d <= 0) return "Deadline passed";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}

export default function EventsPage() {
  const { data: authSession } = useSession();
  const [events, setEvents] = useState<PitchCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => { setEvents(d.competitions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!form.name.trim() || !form.organizer.trim() || !form.url.trim() || !form.deadline) return;
    setSubmitting(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        organizer: form.organizer.trim(),
        deadline: new Date(form.deadline).getTime(),
        eventDate: form.eventDate ? new Date(form.eventDate).getTime() : undefined,
        prize: form.prize.trim() || undefined,
        location: form.location.trim() || "Remote",
        url: form.url.trim(),
        sector: form.sector.trim() || undefined,
        stage: form.stage.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setEvents((prev) => [...prev, data.competition].sort((a, b) => a.deadline - b.deadline));
      setShowForm(false);
      setForm({ ...BLANK });
    } else {
      setMsg(data.error ?? "Error submitting");
      setTimeout(() => setMsg(""), 3000);
    }
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-4 py-20 max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-2">Devbridge</p>
          <h1 className="text-3xl font-bold mb-2">Pitch Competitions</h1>
          <p className="text-[#666] text-sm">Upcoming pitch competitions, hackathons, and grant deadlines for Indian founders.</p>
        </div>
        {authSession?.user ? (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-[#E8A838] text-black text-sm font-semibold rounded-lg hover:bg-[#f0b84a] transition shrink-0">
            Submit an Event
          </button>
        ) : (
          <a href="/login" className="text-xs text-[#E8A838] hover:underline self-center">Sign in to submit →</a>
        )}
      </div>

      {showForm && (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 mb-8 space-y-4">
          <h3 className="text-sm font-semibold text-white">Submit a Competition</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#666] block mb-1">Competition name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
                placeholder="e.g. Startup India Pitch" />
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-1">Organizer</label>
              <input value={form.organizer} onChange={(e) => setForm((f) => ({ ...f, organizer: e.target.value }))}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
                placeholder="e.g. NASSCOM" />
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-1">Application deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50" />
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-1">Event date (optional)</label>
              <input type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50" />
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-1">Prize / Grant</label>
              <input value={form.prize} onChange={(e) => setForm((f) => ({ ...f, prize: e.target.value }))}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
                placeholder="e.g. ₹10L grant" />
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-1">Location</label>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
                placeholder="Remote / Bangalore" />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#666] block mb-1">Application URL</label>
            <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
              placeholder="https://..." />
          </div>
          {msg && <p className="text-red-400 text-xs">{msg}</p>}
          <div className="flex gap-3">
            <button onClick={submit} disabled={submitting || !form.name.trim() || !form.organizer.trim() || !form.deadline || !form.url.trim()}
              className="px-4 py-2 bg-[#E8A838] text-black text-sm font-semibold rounded-lg hover:bg-[#f0b84a] transition disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-[#555] hover:text-white transition">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[#444] text-sm">Loading…</p>
      ) : events.length === 0 ? (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-10 text-center">
          <p className="text-[#444] text-sm mb-2">No upcoming events yet.</p>
          {authSession?.user && <button onClick={() => setShowForm(true)} className="text-xs text-[#E8A838] hover:underline">Submit the first one →</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => {
            const urgent = (e.deadline - Date.now()) < 7 * 24 * 3600 * 1000;
            return (
              <div key={e.id} className="bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-xl p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{e.name}</p>
                  <p className="text-[#555] text-xs mt-0.5">by {e.organizer} · {e.location}</p>
                  {e.prize && <p className="text-[#E8A838] text-xs mt-1">Prize: {e.prize}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${urgent ? "text-red-400 border-red-800/40" : "text-[#444] border-[#222]"}`}>
                      Deadline: {fmtDate(e.deadline)} · {daysLeft(e.deadline)}
                    </span>
                    {e.eventDate && <span className="text-[10px] text-[#333]">Event: {fmtDate(e.eventDate)}</span>}
                  </div>
                </div>
                <a href={e.url} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#E8A838]/10 text-[#E8A838] border border-[#E8A838]/30 text-xs font-medium rounded-lg hover:bg-[#E8A838]/20 transition shrink-0">
                  Apply →
                </a>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
