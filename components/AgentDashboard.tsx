"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { AgentProfile, AgentClientEntry, AgentMessage, AdminCoupon, AgentClientMsg } from "@/lib/db";
import NewsFeed from "./NewsFeed";

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtRs(paise: number) {
  return "₹" + (paise / 100).toLocaleString("en-IN");
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#1a1a1a] border border-[#333] text-[#888] hover:text-white hover:border-[#555] rounded-lg transition"
    >
      {copied ? "✓ Copied" : (label ?? "Copy")}
    </button>
  );
}

const TOOL_LABEL: Record<string, string> = {
  readiness: "Readiness Check",
  advisor: "Advisor Report",
  pitchdeck: "Pitch Deck",
};

type Props = {
  agent: AgentProfile;
  clients: AgentClientEntry[];
  revenue: number;
  messages: AgentMessage[];
  coupons: AdminCoupon[];
  siteUrl: string;
  userName: string;
  userPicture?: string;
};

type Conversation = { clientEmail: string; lastMsg: AgentClientMsg | null; unread: number };

export default function AgentDashboard({ agent, clients, revenue, messages: initialMessages, coupons, siteUrl, userName, userPicture }: Props) {
  const [messages, setMessages] = useState<AgentMessage[]>(initialMessages);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatThread, setChatThread] = useState<AgentClientMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const inviteLink = `${siteUrl}?agref=${agent.agentCode}`;
  const unreadCount = messages.filter((m) => !m.readAt).length;

  useEffect(() => {
    fetch("/api/agent/messages").then((r) => r.json()).then((d: { messages?: AgentMessage[] }) => {
      if (d.messages) setMessages(d.messages);
    }).catch(() => {});

    if (agent.status === "active") {
      fetch("/api/agent/chat").then((r) => r.json()).then((d: { conversations?: Conversation[] }) => {
        if (d.conversations) setConversations(d.conversations);
      }).catch(() => {});
    }
  }, [agent.status]);

  const openChat = async (clientEmail: string) => {
    setActiveChat(clientEmail);
    const res = await fetch(`/api/agent/chat?with=${encodeURIComponent(clientEmail)}`);
    const data = await res.json() as { messages?: AgentClientMsg[] };
    setChatThread(data.messages ?? []);
  };

  const sendChatMsg = async () => {
    if (!activeChat || !chatInput.trim() || chatSending) return;
    setChatSending(true);
    const res = await fetch("/api/agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientEmail: activeChat, body: chatInput.trim() }),
    });
    const data = await res.json() as { message?: AgentClientMsg };
    if (data.message) setChatThread((prev) => [...prev, data.message!]);
    setChatInput("");
    setChatSending(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-16">
      {/* Header */}
      <div className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="text-[#555] hover:text-white text-sm transition">← Home</Link>
          <div className="flex items-center gap-3">
            {userPicture ? (
              <Image src={userPicture} alt={userName} width={32} height={32} className="rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#E8A838] flex items-center justify-center text-black text-sm font-bold">
                {userName[0]?.toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-white text-sm font-medium">{userName}</p>
              <p className="text-[#E8A838] text-xs">Agent · {agent.agentCode}</p>
            </div>
          </div>
          <a href="/api/auth/signout" className="text-xs text-[#555] hover:text-white transition">Sign out</a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#E8A838]">{fmtRs(revenue)}</div>
            <div className="text-xs text-[#555] mt-1">Total Revenue</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{clients.length}</div>
            <div className="text-xs text-[#555] mt-1">Clients</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${agent.subscriptionStatus === "active" ? "text-green-400" : "text-red-400"}`}>
              {agent.subscriptionStatus === "active" ? "Active" : "Inactive"}
            </div>
            <div className="text-xs text-[#555] mt-1">Subscription</div>
          </div>
        </div>

        {/* Invite Link */}
        <div className="bg-[#111] border border-[#E8A838]/20 rounded-xl p-5">
          <h2 className="text-white text-sm font-semibold mb-1">Your Invite Link</h2>
          <p className="text-[#666] text-xs mb-4 leading-relaxed">
            Share this link with founders. When they visit Devbridge through your link and make a purchase,
            they'll be tracked as your client. Use coupons below to give them discounts.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="flex-1 min-w-0 text-xs text-[#888] bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 truncate font-mono">
              {inviteLink}
            </code>
            <CopyButton text={inviteLink} label="Copy Link" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[#444] text-xs">Your code:</span>
            <span className="font-mono text-[#E8A838] text-sm font-bold">{agent.agentCode}</span>
            <CopyButton text={agent.agentCode} label="Copy Code" />
          </div>
        </div>

        {/* Messages from admin */}
        {messages.length > 0 && (
          <div>
            <h2 className="text-xs text-[#444] uppercase tracking-widest mb-3">
              Messages from Devbridge
              {unreadCount > 0 && (
                <span className="ml-2 text-[10px] bg-[#E8A838] text-black px-1.5 py-0.5 rounded-full font-bold">{unreadCount} new</span>
              )}
            </h2>
            <div className="space-y-2">
              {[...messages].reverse().map((m) => (
                <div key={m.id} className={`bg-[#111] border rounded-xl p-4 ${!m.readAt ? "border-[#E8A838]/30" : "border-[#1a1a1a]"}`}>
                  <p className="text-white text-sm leading-relaxed">{m.body}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[#444] text-xs">{fmtDate(m.sentAt)}</span>
                    {!m.readAt && <span className="text-[10px] text-[#E8A838] font-medium">NEW</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coupons */}
        {coupons.length > 0 && (
          <div>
            <h2 className="text-xs text-[#444] uppercase tracking-widest mb-3">Your Coupons</h2>
            <div className="space-y-2">
              {coupons.map((c) => {
                const used = c.revokedAt || (c.expiresAt && Date.now() > c.expiresAt) || (c.maxUses !== null && c.usedCount >= c.maxUses);
                return (
                  <div key={c.code} className={`bg-[#111] border rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap ${used ? "border-[#1a1a1a] opacity-50" : "border-green-800/30"}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-white tracking-wide">{c.code}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${used ? "border-[#333] text-[#444]" : "border-green-800 text-green-400 bg-green-900/10"}`}>
                          {c.revokedAt ? "Revoked" : c.expiresAt && Date.now() > c.expiresAt ? "Expired" : c.maxUses !== null && c.usedCount >= c.maxUses ? "Limit Reached" : `${c.discount}% OFF · Active`}
                        </span>
                      </div>
                      <p className="text-[#555] text-xs mt-0.5">{c.name}</p>
                      <p className="text-[#444] text-xs mt-0.5">
                        Used {c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : ""} times
                        {c.expiresAt && ` · Expires ${fmtDate(c.expiresAt)}`}
                      </p>
                    </div>
                    {!used && <CopyButton text={c.code} label="Copy Code" />}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[#444] mt-3">Share these codes with founders you bring in. They get a discount; you track conversions.</p>
          </div>
        )}

        {/* Clients */}
        {clients.length > 0 ? (
          <div>
            <h2 className="text-xs text-[#444] uppercase tracking-widest mb-3">Your Clients ({clients.length})</h2>
            <div className="space-y-2">
              {[...clients].sort((a, b) => b.createdAt - a.createdAt).map((c, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-white text-sm font-medium">{c.clientName ?? "—"}</p>
                    {c.clientEmail && <p className="text-[#555] text-xs mt-0.5">{c.clientEmail}</p>}
                    <p className="text-[#444] text-xs mt-0.5">{TOOL_LABEL[c.tool] ?? c.tool} · {fmtDate(c.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-[#E8A838] font-bold text-sm">{fmtRs(c.amount)}</p>
                    {c.clientEmail && (
                      <button
                        onClick={() => openChat(c.clientEmail!)}
                        className="text-xs px-2 py-1 border border-[#333] text-[#666] hover:text-white hover:border-[#555] rounded-lg transition"
                      >
                        Chat
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[#444] text-sm">No clients yet.</p>
            <p className="text-[#333] text-xs mt-1">Share your invite link above to start tracking clients.</p>
          </div>
        )}

        {/* Client Chat Panel */}
        {conversations.length > 0 && !activeChat && (
          <div>
            <h2 className="text-xs text-[#444] uppercase tracking-widest mb-3">Client Messages</h2>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.clientEmail}
                  onClick={() => openChat(conv.clientEmail)}
                  className="w-full text-left bg-[#111] border border-[#222] hover:border-[#444] rounded-xl p-4 flex items-center justify-between gap-3 transition"
                >
                  <div>
                    <p className="text-white text-sm">{conv.clientEmail}</p>
                    {conv.lastMsg && <p className="text-[#555] text-xs mt-0.5 truncate">{conv.lastMsg.body}</p>}
                  </div>
                  {conv.unread > 0 && (
                    <span className="text-[10px] bg-[#E8A838] text-black px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">{conv.unread}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active chat window */}
        {activeChat && (
          <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
              <div>
                <p className="text-white text-sm font-medium">{activeChat}</p>
                <p className="text-[#444] text-xs">Client</p>
              </div>
              <button onClick={() => setActiveChat(null)} className="text-[#444] hover:text-white text-xs transition">Close</button>
            </div>
            <div className="h-48 overflow-y-auto p-4 space-y-2">
              {chatThread.length === 0 && <p className="text-[#333] text-xs text-center py-4">No messages yet.</p>}
              {chatThread.map((m) => (
                <div key={m.id} className={`flex ${m.from === agent.email ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.from === agent.email ? "bg-[#E8A838] text-black" : "bg-[#1a1a1a] text-white"}`}>
                    {m.body}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-4 border-t border-[#1a1a1a]">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChatMsg()}
                placeholder="Message…"
                className="flex-1 bg-[#0d0d0d] border border-[#333] rounded-xl px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition"
              />
              <button
                onClick={sendChatMsg}
                disabled={chatSending || !chatInput.trim()}
                className="px-4 py-2 bg-[#E8A838] hover:bg-[#d4962e] text-black font-semibold rounded-xl text-sm transition disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/brainstorm" className="bg-[#111] border border-[#222] hover:border-[#444] rounded-xl p-3 text-center transition">
            <div className="text-xl mb-1">💡</div>
            <p className="text-[#888] text-xs">Brainstorm</p>
          </Link>
          <Link href="/insights" className="bg-[#111] border border-[#222] hover:border-[#444] rounded-xl p-3 text-center transition">
            <div className="text-xl mb-1">📖</div>
            <p className="text-[#888] text-xs">Insights Blog</p>
          </Link>
        </div>

        {/* News Feed */}
        <div>
          <h2 className="text-xs text-[#444] uppercase tracking-widest mb-3">Startup News & Grants</h2>
          <NewsFeed />
        </div>
      </div>
    </main>
  );
}
