"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-red-500/40 text-5xl font-bold mb-4">!</p>
        <h1 className="font-crimson text-2xl text-white mb-2">Something went wrong</h1>
        <p className="text-[#666] text-sm mb-8 leading-relaxed">
          An unexpected error occurred. Your session data is safe. You can try again or start over.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#E8A838] text-black font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-[#d4962e] transition"
          >
            Try again
          </button>
          <a
            href="/"
            className="bg-[#1a1a1a] border border-[#333] text-[#888] px-5 py-2.5 rounded-lg text-sm hover:text-white transition"
          >
            Home
          </a>
        </div>
      </div>
    </main>
  );
}
