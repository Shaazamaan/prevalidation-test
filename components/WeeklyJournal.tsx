"use client";

import { useState } from "react";

type JournalEntry = {
  weekKey: string;
  shipped: string;
  learned: string;
  blocker: string;
  savedAt: number;
};

function fmtWeek(wk: string) {
  const [year, week] = wk.split("-W");
  const jan4 = new Date(parseInt(year), 0, 4);
  const startMs = jan4.getTime() - ((jan4.getDay() || 7) - 1) * 86400000 + (parseInt(week) - 1) * 7 * 86400000;
  const start = new Date(startMs);
  const end = new Date(startMs + 6 * 86400000);
  return `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}

const PROMPTS = [
  { key: "shipped" as const, label: "What did you ship?", placeholder: "A feature, a conversation, a prototype, a post — anything you built or pushed forward." },
  { key: "learned" as const, label: "What did you learn?", placeholder: "About your customers, market, team, or yourself." },
  { key: "blocker" as const, label: "What's your biggest blocker?", placeholder: "What's the one thing you need to solve to move forward?" },
];

export default function WeeklyJournal({
  initialEntries,
  currentWeek,
}: {
  initialEntries: JournalEntry[];
  currentWeek: string;
}) {
  const thisWeek = initialEntries.find((e) => e.weekKey === currentWeek);
  const [form, setForm] = useState({ shipped: thisWeek?.shipped ?? "", learned: thisWeek?.learned ?? "", blocker: thisWeek?.blocker ?? "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [view, setView] = useState<"write" | "history">("write");

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, weekKey: currentWeek }),
    });
    const d = await res.json() as { entry?: JournalEntry };
    if (d.entry) {
      setEntries((prev) => {
        const filtered = prev.filter((e) => e.weekKey !== currentWeek);
        return [d.entry!, ...filtered].sort((a, b) => b.savedAt - a.savedAt);
      });
      setSaved(true);
    }
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-14 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-1">Weekly Journal</p>
          <h1 className="font-crimson text-2xl sm:text-3xl font-semibold text-white">Reflect on your week</h1>
          <p className="text-[#444] text-xs mt-1">3 questions · 2 minutes · every week</p>
        </div>

        <div className="flex gap-1 mb-6 border-b border-[#1a1a1a]">
          {(["write", "history"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${view === v ? "border-[#E8A838] text-[#E8A838]" : "border-transparent text-[#555] hover:text-white"}`}
            >
              {v === "write" ? `This week (${currentWeek})` : `History (${entries.length})`}
            </button>
          ))}
        </div>

        {view === "write" ? (
          <div className="space-y-5">
            {PROMPTS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-sm text-[#888] block mb-2">{label}</label>
                <textarea
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  rows={3}
                  className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50 resize-none"
                />
              </div>
            ))}
            <button
              onClick={save}
              disabled={saving}
              className="w-full py-3 bg-[#E8A838] text-black font-semibold text-sm rounded-xl hover:bg-[#d4962e] transition disabled:opacity-50"
            >
              {saving ? "Saving…" : saved ? "✓ Saved" : "Save this week"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.length === 0 ? (
              <p className="text-[#333] text-sm text-center py-8">No entries yet. Start writing this week.</p>
            ) : entries.map((e) => (
              <div key={e.weekKey} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 space-y-3">
                <p className="text-xs text-[#444] uppercase tracking-widest">{fmtWeek(e.weekKey)}</p>
                {e.shipped && <div><p className="text-[10px] text-[#555] mb-0.5">Shipped</p><p className="text-[#888] text-sm">{e.shipped}</p></div>}
                {e.learned && <div><p className="text-[10px] text-[#555] mb-0.5">Learned</p><p className="text-[#888] text-sm">{e.learned}</p></div>}
                {e.blocker && <div><p className="text-[10px] text-red-500/60 mb-0.5">Blocker</p><p className="text-[#888] text-sm">{e.blocker}</p></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
