"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import MessageBubble from "./MessageBubble";
import type { Message } from "@/lib/db";

type Props = {
  sessionId: string;
  founderName: string;
  startupIdea: string;
  initialMessages: Message[];
  isCompleted: boolean;
};

const REPORT_REGEX = /<REPORT>([\s\S]*?)<\/REPORT>/;

export default function ChatInterface({
  sessionId,
  founderName,
  startupIdea,
  initialMessages,
  isCompleted,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [locked, setLocked] = useState(isCompleted);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Send startup idea as first message automatically
  useEffect(() => {
    if (messages.length === 0 && !isCompleted) {
      sendMessage(startupIdea);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || locked) return;
    setLoading(true);
    setStreamingContent("");

    const userMsg: Message = { role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${err.error}`, timestamp: Date.now() },
        ]);
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              accumulated += parsed.token;
              setStreamingContent(accumulated);
            }
          } catch {
            // partial
          }
        }
      }

      setStreamingContent("");

      const reportMatch = REPORT_REGEX.exec(accumulated);
      if (reportMatch) {
        const cleanContent = accumulated.replace(REPORT_REGEX, "").trim();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: cleanContent || "Your readiness report is ready.", timestamp: Date.now() },
        ]);
        try {
          const reportJson = JSON.parse(reportMatch[1].trim());
          await fetch("/api/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, reportJson }),
          });
        } catch {
          // continue to redirect anyway
        }
        setLocked(true);
        router.push(`/report/${sessionId}`);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: accumulated, timestamp: Date.now() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please refresh.", timestamp: Date.now() },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a1a] bg-[#0d0d0d] shrink-0">
        <span className="font-crimson text-lg text-white font-semibold">Founder Readiness Check</span>
        <span className="text-sm text-[#666]">{founderName}</span>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {streamingContent && (
          <MessageBubble role="assistant" content={streamingContent} />
        )}
        {loading && !streamingContent && (
          <div className="flex justify-start mb-4">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="typing-dot w-2 h-2 bg-[#666] rounded-full inline-block" />
                <span className="typing-dot w-2 h-2 bg-[#666] rounded-full inline-block" />
                <span className="typing-dot w-2 h-2 bg-[#666] rounded-full inline-block" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[#1a1a1a] bg-[#0d0d0d] px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={locked || loading}
            rows={1}
            placeholder={locked ? "Session closed." : "Your response…"}
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] resize-none disabled:opacity-40 transition"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={locked || loading || !input.trim()}
            className="bg-[#E8A838] text-black font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-[#d4962e] transition disabled:opacity-40 shrink-0"
          >
            Send
          </button>
        </div>
        <p className="text-center text-xs text-[#333] mt-2">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
