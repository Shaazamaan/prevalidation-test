"use client";

type Props = {
  role: "user" | "assistant";
  content: string;
};

export default function MessageBubble({ role, content }: Props) {
  const isAI = role === "assistant";
  return (
    <div className={`flex ${isAI ? "justify-start" : "justify-end"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
          isAI
            ? "bg-[#141414] border border-[#2a2a2a] text-[#e0e0e0]"
            : "bg-[#1a1200] border border-[#3a2800] text-[#f5d9a0]"
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
