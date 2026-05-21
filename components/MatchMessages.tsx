"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { MatchProfile, ChatMsg } from "@/lib/db";

type MatchEntry = {
  email: string;
  profile: MatchProfile | null;
  messages: ChatMsg[];
};

type Props = {
  myEmail: string;
  matches: MatchEntry[];
};

function gradientFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1},60%,35%), hsl(${h2},70%,25%))`;
}

function fmtTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const CHAT_TTL_DAYS = 90;

export default function MatchMessages({ myEmail, matches }: Props) {
  const [selected, setSelected] = useState<string | null>(matches[0]?.email ?? null);
  const [threads, setThreads] = useState<Record<string, ChatMsg[]>>(
    Object.fromEntries(matches.map((m) => [m.email, m.messages]))
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedMatch = matches.find((m) => m.email === selected);
  const msgs = selected ? (threads[selected] ?? []) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    if (!input.trim() || !selected || sending) return;
    setSending(true);
    const res = await fetch("/api/match/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: selected, body: input.trim() }),
    });
    const data = await res.json() as { message?: ChatMsg };
    if (data.message) {
      setThreads((prev) => ({ ...prev, [selected]: [...(prev[selected] ?? []), data.message!] }));
    }
    setInput("");
    setSending(false);
  };

  const handleExport = () => {
    if (!selected) return;
    window.open(`/api/match/export?with=${encodeURIComponent(selected)}`, "_blank");
  };

  const firstMsgDate = msgs[0]?.sentAt;
  const flushDate = firstMsgDate ? new Date(firstMsgDate + CHAT_TTL_DAYS * 86400 * 1000) : null;
  const daysLeft = flushDate ? Math.max(0, Math.ceil((flushDate.getTime() - Date.now()) / 86400000)) : null;

  if (matches.length === 0) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#555] text-sm mb-4">No matches yet.</p>
          <Link href="/match" className="text-xs px-4 py-2 bg-[#E8A838] text-black font-semibold rounded-lg">
            Find Co-founders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto flex h-screen">

        {/* Sidebar */}
        <div className="w-64 border-r border-[#1a1a1a] flex flex-col">
          <div className="p-4 border-b border-[#1a1a1a]">
            <Link href="/match" className="text-[#555] hover:text-white text-xs transition block mb-1">← Match</Link>
            <h1 className="text-white text-sm font-semibold">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {matches.map((m) => {
              const name = m.profile?.startupName ?? m.email.split("@")[0];
              const lastMsg = (threads[m.email] ?? m.messages).slice(-1)[0];
              return (
                <button
                  key={m.email}
                  onClick={() => setSelected(m.email)}
                  className={`w-full text-left p-4 flex items-center gap-3 hover:bg-[#111] transition border-b border-[#0f0f0f] ${selected === m.email ? "bg-[#111]" : ""}`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: gradientFromName(name) }}
                  >
                    {name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-medium truncate">{name}</p>
                    {lastMsg && <p className="text-[#444] text-xs truncate">{lastMsg.from === myEmail ? "You: " : ""}{lastMsg.body}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col min-w-0">
          {selected && selectedMatch ? (
            <>
              <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: gradientFromName(selectedMatch.profile?.startupName ?? selected) }}
                  >
                    {(selectedMatch.profile?.startupName ?? selected)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{selectedMatch.profile?.startupName ?? selected}</p>
                    {selectedMatch.profile?.stage && <p className="text-[#444] text-xs">{selectedMatch.profile.stage}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {daysLeft !== null && (
                    <span className="text-[#333] text-xs">{daysLeft}d until flush</span>
                  )}
                  <button onClick={handleExport} className="text-[#444] hover:text-[#888] text-xs transition">Export</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgs.length === 0 && (
                  <p className="text-center text-[#333] text-xs py-8">Say hi to {selectedMatch.profile?.displayName ?? selected.split("@")[0]}!</p>
                )}
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.from === myEmail ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.from === myEmail ? "bg-[#E8A838] text-black" : "bg-[#1a1a1a] text-white"}`}>
                      <p>{m.body}</p>
                      <p className={`text-[10px] mt-1 ${m.from === myEmail ? "text-black/50" : "text-[#444]"}`}>{fmtTime(m.sentAt)}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {daysLeft !== null && daysLeft <= 7 && (
                <div className="px-4 py-2 bg-amber-900/20 border-t border-amber-900/30 text-xs text-amber-400">
                  Chat auto-deletes in {daysLeft} day{daysLeft !== 1 ? "s" : ""}.{" "}
                  <button onClick={handleExport} className="underline">Export now</button>
                </div>
              )}

              <div className="p-4 border-t border-[#1a1a1a] flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Message…"
                  className="flex-1 bg-[#111] border border-[#222] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
                />
                <button
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="px-4 py-2.5 bg-[#E8A838] hover:bg-[#d4962e] text-black font-semibold rounded-xl text-sm transition disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[#333] text-sm">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
