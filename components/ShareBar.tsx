"use client";

import { useState, useEffect } from "react";

interface Props {
  path: string;
  title: string;
  score?: string;
}

export default function ShareBar({ path, title, score }: Props) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.origin + path);
  }, [path]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const waText = encodeURIComponent(
    `I got my startup evaluated by Devbridge! ${title}${score ? ` — Score: ${score}` : ""} — ${url}`
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleCopy}
        className="text-xs px-3 py-1.5 border border-[#333] text-[#666] rounded-lg hover:text-white hover:border-[#555] transition"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
      <a
        href={`https://wa.me/?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-3 py-1.5 border border-[#333] text-[#666] rounded-lg hover:text-green-400 hover:border-green-800 transition"
      >
        WhatsApp
      </a>
      <button
        onClick={() => window.print()}
        className="text-xs px-3 py-1.5 border border-[#333] text-[#666] rounded-lg hover:text-white hover:border-[#555] transition"
      >
        Save as PDF
      </button>
    </div>
  );
}

export function StickyShareBar({ path, title }: { path: string; title: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(window.location.origin + path);
  }, [path]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const waText = encodeURIComponent(`I got my startup evaluated by Devbridge! ${title} — ${url}`);

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-[#222] px-4 py-3 z-40 flex gap-2">
      <button
        onClick={handleCopy}
        className="flex-1 text-xs py-2.5 border border-[#333] text-[#888] rounded-lg hover:text-white hover:border-[#555] transition"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
      <a
        href={`https://wa.me/?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center text-xs py-2.5 border border-[#333] text-[#888] rounded-lg hover:text-green-400 hover:border-green-800 transition"
      >
        WhatsApp
      </a>
      <button
        onClick={() => window.print()}
        className="flex-1 text-xs py-2.5 border border-[#333] text-[#888] rounded-lg hover:text-white hover:border-[#555] transition"
      >
        PDF
      </button>
    </div>
  );
}
