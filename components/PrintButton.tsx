"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs px-3 py-1.5 border border-[#333] text-[#666] rounded-lg hover:text-white hover:border-[#555] transition print:hidden"
    >
      ↓ Save as PDF
    </button>
  );
}
