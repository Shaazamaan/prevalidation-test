"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { BrainstormDoc, TodoItem } from "@/lib/db";

type Props = {
  email: string;
  initialDoc: BrainstormDoc;
};

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const PRIORITY_COLORS = {
  high: "text-red-400 border-red-900/40",
  medium: "text-amber-400 border-amber-900/40",
  low: "text-[#555] border-[#222]",
};

export default function BrainstormBoard({ initialDoc }: Props) {
  const [notes, setNotes] = useState(initialDoc.notes);
  const [todos, setTodos] = useState<TodoItem[]>(initialDoc.todos);
  const [newTodo, setNewTodo] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(async (updatedNotes: string, updatedTodos: TodoItem[]) => {
    setSaving(true);
    try {
      await fetch("/api/brainstorm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: updatedNotes, todos: updatedTodos }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  }, []);

  const scheduleAutoSave = useCallback((updatedNotes: string, updatedTodos: TodoItem[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(updatedNotes, updatedTodos), 1500);
  }, [persist]);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    scheduleAutoSave(val, todos);
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const item: TodoItem = { id: genId(), text: newTodo.trim(), done: false, priority: newPriority, createdAt: Date.now() };
    const updated = [...todos, item];
    setTodos(updated);
    setNewTodo("");
    scheduleAutoSave(notes, updated);
  };

  const toggleTodo = (id: string) => {
    const updated = todos.map((t) => t.id === id ? { ...t, done: !t.done } : t);
    setTodos(updated);
    scheduleAutoSave(notes, updated);
  };

  const deleteTodo = (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    scheduleAutoSave(notes, updated);
  };

  const pending = todos.filter((t) => !t.done).sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
  const done = todos.filter((t) => t.done);

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-16 pt-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <Link href="/dashboard" className="text-[#555] hover:text-white text-sm transition block mb-1">← Dashboard</Link>
            <h1 className="text-white text-2xl font-semibold">Brainstorm Workspace</h1>
          </div>
          <div className="text-xs text-[#444]">
            {saving ? "Saving…" : saved ? "✓ Saved" : "Auto-saves"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notes */}
          <div className="space-y-2">
            <label className="text-[#444] text-xs uppercase tracking-widest">Notes & Ideas</label>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={16}
              placeholder="Dump ideas, hypotheses, observations, product specs… anything."
              className="w-full bg-[#111] border border-[#222] rounded-2xl px-4 py-3 text-white text-sm placeholder-[#333] focus:outline-none focus:border-[#E8A838] transition resize-none leading-relaxed"
            />
          </div>

          {/* Todos */}
          <div className="space-y-4">
            <label className="text-[#444] text-xs uppercase tracking-widest">Action Items</label>

            {/* Add todo */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4 space-y-3">
              <input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTodo()}
                placeholder="Add action item…"
                className="w-full bg-[#0d0d0d] border border-[#333] rounded-xl px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
              />
              <div className="flex items-center gap-2">
                {(["high", "medium", "low"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setNewPriority(p)}
                    className={`text-xs px-3 py-1 rounded-lg border transition ${newPriority === p ? PRIORITY_COLORS[p] + " bg-[#1a1a1a]" : "border-[#222] text-[#444] hover:border-[#333]"}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={addTodo}
                  className="ml-auto text-xs px-3 py-1 bg-[#E8A838] text-black font-semibold rounded-lg hover:bg-[#d4962e] transition"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Pending todos */}
            {pending.length > 0 && (
              <div className="space-y-2">
                {pending.map((t) => (
                  <div key={t.id} className={`flex items-start gap-3 bg-[#111] border rounded-xl p-3 ${PRIORITY_COLORS[t.priority]}`}>
                    <button onClick={() => toggleTodo(t.id)} className="mt-0.5 w-4 h-4 rounded border border-current flex-shrink-0 hover:bg-current/20 transition" />
                    <span className="text-white text-sm flex-1 leading-relaxed">{t.text}</span>
                    <button onClick={() => deleteTodo(t.id)} className="text-[#333] hover:text-red-400 text-xs transition flex-shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Done todos */}
            {done.length > 0 && (
              <div className="space-y-2 opacity-40">
                <p className="text-[#444] text-xs">Done ({done.length})</p>
                {done.map((t) => (
                  <div key={t.id} className="flex items-start gap-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3">
                    <button onClick={() => toggleTodo(t.id)} className="mt-0.5 w-4 h-4 rounded border border-green-600 bg-green-600/20 flex-shrink-0" />
                    <span className="text-[#555] text-sm flex-1 line-through">{t.text}</span>
                    <button onClick={() => deleteTodo(t.id)} className="text-[#333] hover:text-red-400 text-xs transition flex-shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}

            {todos.length === 0 && (
              <p className="text-[#333] text-xs text-center py-4">No action items yet.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
