"use client";

import { useState } from "react";

type Props = {
  score: number;
  url: string;
  verdict?: string;
};

export default function ShareButtons({ score, url, verdict }: Props) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"friends" | "investor">("friends");

  const verdictShort = verdict === "READY" ? "passed" : verdict === "CONDITIONALLY READY" ? "conditionally passed" : "got flagged";

  const friendRaw = `I put my startup through an AI reality check on Devbridge. It ${verdictShort} with a ${score}/100 score — and flagged things I hadn't even thought about.\n\nSee the full breakdown:\n${url}`;
  const investorRaw = `My startup just went through an independent AI readiness evaluation on Devbridge — scored ${score}/100.\n\nFull analysis: ${url}`;

  const friendEncoded = encodeURIComponent(friendRaw);
  const investorEncoded = encodeURIComponent(investorRaw);

  const shareText = tab === "friends" ? friendEncoded : investorEncoded;
  const encoded = encodeURIComponent(url);

  const whatsappUrl = `https://wa.me/?text=${shareText}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tab === "friends" ? friendRaw : investorRaw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing silently
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1 bg-[#111] border border-[#222] rounded-lg p-1">
        <button
          onClick={() => setTab("friends")}
          className={`flex-1 text-xs py-1.5 rounded-md transition ${tab === "friends" ? "bg-[#E8A838] text-black font-semibold" : "text-[#555] hover:text-white"}`}
        >
          Share with Founders
        </button>
        <button
          onClick={() => setTab("investor")}
          className={`flex-1 text-xs py-1.5 rounded-md transition ${tab === "investor" ? "bg-[#E8A838] text-black font-semibold" : "text-[#555] hover:text-white"}`}
        >
          Send to Investor
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-xs font-medium hover:bg-[#25D366]/20 transition"
        >
          WhatsApp
        </a>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A66C2]/10 border border-[#0A66C2]/30 text-[#0A66C2] text-xs font-medium hover:bg-[#0A66C2]/20 transition"
        >
          LinkedIn
        </a>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2] text-xs font-medium hover:bg-[#1DA1F2]/20 transition"
        >
          X / Twitter
        </a>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-xs font-medium hover:text-white hover:border-[#444] transition"
        >
          {copied ? <span className="text-green-400">Copied!</span> : <span>Copy Text</span>}
        </button>
      </div>

      <p className="text-[10px] text-[#333] text-center leading-relaxed italic">
        {tab === "friends"
          ? `"It ${verdictShort} with a ${score}/100 score — and flagged things I hadn't even thought about."`
          : `"Independent AI readiness evaluation — scored ${score}/100"`}
      </p>
    </div>
  );
}
