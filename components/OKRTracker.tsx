"use client";

import { useState, useCallback } from "react";
import type { OKREntry } from "@/lib/db";

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

function formatQuarter(q: string): string {
  const [year, quarter] = q.split("-");
  return `${quarter} ${year}`;
}

function progressColor(p: number): string {
  if (p < 33) return "bg-red-500";
  if (p < 67) return "bg-yellow-500";
  return "bg-green-500";
}

export default function OKRTracker({ initialOKRs }: { initialOKRs: OKREntry[] }) {
  const currentQ = getCurrentQuarter();

  const existing = initialOKRs.find((o) => o.quarter === currentQ);

  const [objective, setObjective] = useState(existing?.objective ?? "");
  const [keyResults, setKeyResults] = useState<{ text: string; progress: number }[]>(
    existing?.keyResults?.length
      ? existing.keyResults
      : [{ text: "", progress: 0 }]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [okrs, setOKRs] = useState<OKREntry[]>(initialOKRs);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const save = useCallback(async () => {
    if (!objective.trim()) return;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/okr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarter: currentQ, objective, keyResults }),
      });
      const data = await res.json() as { entry?: OKREntry; error?: string };
      if (data.entry) {
        setOKRs((prev) => {
          const filtered = prev.filter((o) => o.quarter !== currentQ);
          return [data.entry!, ...filtered].sort((a, b) => b.savedAt - a.savedAt);
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error ?? "Failed to save");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [objective, keyResults, currentQ]);

  const addKR = () => {
    if (keyResults.length < 3) {
      setKeyResults([...keyResults, { text: "", progress: 0 }]);
    }
  };

  const removeKR = (i: number) => {
    if (keyResults.length > 1) {
      setKeyResults(keyResults.filter((_, idx) => idx !== i));
    }
  };

  const updateKR = (i: number, field: "text" | "progress", value: string | number) => {
    const updated = [...keyResults];
    updated[i] = { ...updated[i], [field]: value };
    setKeyResults(updated);
  };

  const pastOKRs = okrs.filter((o) => o.quarter !== currentQ);

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-1">OKR Tracker</p>
        <h1 className="font-crimson text-2xl sm:text-3xl font-semibold text-white mb-2">
          {formatQuarter(currentQ)} Objectives
        </h1>
        <p className="text-[#555] text-sm mb-8">Set one clear objective with up to 3 measurable key results.</p>

        {/* Current quarter form */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 mb-6">
          <div className="mb-5">
            <label className="text-xs text-[#555] uppercase tracking-widest block mb-2">Objective</label>
            <input
              type="text"
              value={objective}
              maxLength={100}
              onChange={(e) => setObjective(e.target.value)}
              onBlur={save}
              placeholder="What do you want to achieve this quarter?"
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50"
            />
            <p className="text-right text-[10px] text-[#333] mt-1">{objective.length}/100</p>
          </div>

          <div className="space-y-4 mb-5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#555] uppercase tracking-widest">Key Results</label>
              {keyResults.length < 3 && (
                <button
                  onClick={addKR}
                  className="text-xs text-[#E8A838] hover:text-[#d4962e] transition"
                >
                  + Add KR
                </button>
              )}
            </div>

            {keyResults.map((kr, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
                <div className="flex gap-2 mb-3">
                  <span className="text-xs text-[#444] mt-0.5 flex-shrink-0">KR {i + 1}</span>
                  <input
                    type="text"
                    value={kr.text}
                    onChange={(e) => updateKR(i, "text", e.target.value)}
                    onBlur={save}
                    placeholder="Key result description…"
                    className="flex-1 bg-transparent text-sm text-white placeholder-[#333] focus:outline-none"
                  />
                  {keyResults.length > 1 && (
                    <button
                      onClick={() => removeKR(i)}
                      className="text-[#333] hover:text-red-400 transition text-xs flex-shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={kr.progress}
                    onChange={(e) => updateKR(i, "progress", Number(e.target.value))}
                    onMouseUp={save}
                    onTouchEnd={save}
                    className="flex-1 accent-[#E8A838]"
                  />
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    kr.progress < 33 ? "text-red-400 bg-red-400/10" :
                    kr.progress < 67 ? "text-yellow-400 bg-yellow-400/10" :
                    "text-green-400 bg-green-400/10"
                  }`}>
                    {kr.progress}%
                  </span>
                </div>
                <div className="mt-2 w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progressColor(kr.progress)}`}
                    style={{ width: `${kr.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

          <button
            onClick={save}
            disabled={saving || !objective.trim()}
            className="w-full py-3 bg-[#E8A838] text-black font-semibold text-sm rounded-xl hover:bg-[#d4962e] transition disabled:opacity-40"
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save OKRs"}
          </button>
        </div>

        {/* History */}
        {pastOKRs.length > 0 && (
          <div>
            <p className="text-xs text-[#444] uppercase tracking-widest mb-3">Past Quarters</p>
            <div className="space-y-3">
              {pastOKRs.sort((a, b) => b.savedAt - a.savedAt).map((okr) => {
                const isExpanded = expandedHistory === okr.quarter;
                const avgProgress = okr.keyResults.length
                  ? Math.round(okr.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / okr.keyResults.length)
                  : 0;
                return (
                  <div key={okr.quarter} className="bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedHistory(isExpanded ? null : okr.quarter)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-[#161616] transition"
                    >
                      <div>
                        <p className="text-xs text-[#E8A838] mb-1">{formatQuarter(okr.quarter)}</p>
                        <p className="text-sm text-white font-medium">{okr.objective}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs font-medium ${
                          avgProgress < 33 ? "text-red-400" :
                          avgProgress < 67 ? "text-yellow-400" :
                          "text-green-400"
                        }`}>
                          {avgProgress}%
                        </span>
                        <span className="text-[#444] text-xs">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-[#1a1a1a] pt-4 space-y-3">
                        {okr.keyResults.map((kr, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-[#888]">KR {i + 1}: {kr.text || "—"}</span>
                              <span className="text-[#555]">{kr.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${progressColor(kr.progress)}`}
                                style={{ width: `${kr.progress}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
