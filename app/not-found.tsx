import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-[#333] text-6xl font-bold mb-4">404</p>
        <h1 className="font-crimson text-2xl text-white mb-2">Page not found</h1>
        <p className="text-[#666] text-sm mb-8 leading-relaxed">
          This page doesn't exist, or the session you're looking for has expired.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#E8A838] text-black font-semibold px-6 py-3 rounded-lg text-sm hover:bg-[#d4962e] transition"
        >
          Start a new session →
        </Link>
      </div>
    </main>
  );
}
