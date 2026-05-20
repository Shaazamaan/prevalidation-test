"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/admin/dashboard");
      } else if (res.status === 429) {
        setError("Too many attempts. Try again in 1 hour.");
      } else if (res.status === 500) {
        setError("Server error — check environment variables.");
      } else {
        setError("Invalid credentials.");
      }
    } catch {
      setError("Network error. Try again.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#111] border border-[#222] rounded-xl p-8">
        <h1 className="font-crimson text-2xl font-semibold mb-6 text-white">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#888] mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E8A838]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#888] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E8A838]"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E8A838] text-black font-semibold py-2 rounded-lg text-sm hover:bg-[#d4962e] transition disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="text-center text-xs text-[#333] mt-4">
          Admin login requires ADMIN_USERNAME and ADMIN_PASSWORD environment variables set in Vercel.
        </p>
      </div>
    </main>
  );
}
