"use client";

import { useState, useEffect } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 w-10 h-10 rounded-full bg-[#E8A838] text-black font-bold text-base flex items-center justify-center shadow-lg hover:bg-[#d4962e] transition print:hidden"
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}
