import Link from "next/link";

export default function PitchDeckReportNotFound() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-4">Report Not Found</p>
        <h1 className="font-crimson text-4xl text-white mb-4">This report has expired</h1>
        <p className="text-[#666] text-base leading-relaxed mb-8">
          Devbridge reports are stored for 90 days. This report's link is no longer active.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#E8A838] text-black font-semibold px-8 py-4 rounded-xl text-sm hover:bg-[#d4962e] transition"
        >
          Get Your Own Evaluation →
        </Link>
      </div>
    </main>
  );
}
