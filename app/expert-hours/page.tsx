"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type ExpertSlot = {
  id: string;
  expertEmail: string;
  expertName: string;
  bio: string;
  expertise: string[];
  bookingUrl: string;
  feePaise: number;
  active: boolean;
  addedAt: number;
};

const BLANK = { expertName: "", bio: "", expertiseInput: "", bookingUrl: "" };

export default function ExpertHoursPage() {
  const { data: authSession } = useSession();
  const [slots, setSlots] = useState<ExpertSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  // Payment happens on the expert's own booking platform (Calendly, Cal.com, etc.)
  // We don't process any payments here — just connect founders with experts.

  useEffect(() => {
    fetch("/api/expert-hours")
      .then((r) => r.json())
      .then((d) => { setSlots(d.slots ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const alreadyListed = slots.some((s) => s.expertEmail === authSession?.user?.email);

  const submit = async () => {
    if (!form.expertName.trim() || !form.bio.trim() || !form.bookingUrl.trim()) return;
    setSubmitting(true);
    const expertise = form.expertiseInput.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch("/api/expert-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expertName: form.expertName, bio: form.bio, expertise, bookingUrl: form.bookingUrl, feePaise: 0 }),
    });
    const data = await res.json();
    if (res.ok) {
      setSlots((prev) => [data.slot, ...prev]);
      setShowForm(false);
      setForm({ ...BLANK });
    } else {
      setMsg(data.error ?? "Error submitting");
      setTimeout(() => setMsg(""), 3000);
    }
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-4 py-20 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-2">Devbridge</p>
        <h1 className="text-3xl font-bold mb-2">Expert Office Hours</h1>
        <p className="text-[#666] text-sm max-w-xl">
          Book time with founders, operators, and domain experts from the community. Or list yourself if you can help others.
        </p>
      </div>

      <div className="flex justify-end mb-6">
        {authSession?.user && !alreadyListed && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#E8A838] text-black text-sm font-semibold rounded-lg hover:bg-[#f0b84a] transition"
          >
            List Yourself as an Expert
          </button>
        )}
        {alreadyListed && (
          <span className="text-xs text-green-400 border border-green-800/40 px-3 py-1.5 rounded-lg">You are listed ✓</span>
        )}
        {!authSession?.user && (
          <a href="/login" className="text-xs text-[#E8A838] hover:underline">Sign in to list yourself →</a>
        )}
      </div>

      {showForm && (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-6 mb-8 space-y-4">
          <h3 className="text-sm font-semibold text-white">Your Expert Profile</h3>
          <div>
            <label className="text-xs text-[#666] block mb-1">Display name</label>
            <input
              value={form.expertName}
              onChange={(e) => setForm((f) => ({ ...f, expertName: e.target.value }))}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-xs text-[#666] block mb-1">Short bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={2}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50 resize-none"
              placeholder="Ex-founder, B2B SaaS expert, 5 years building in fintech..."
            />
          </div>
          <div>
            <label className="text-xs text-[#666] block mb-1">Areas of expertise (comma-separated)</label>
            <input
              value={form.expertiseInput}
              onChange={(e) => setForm((f) => ({ ...f, expertiseInput: e.target.value }))}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
              placeholder="GTM, Fundraising, Product"
            />
          </div>
          <div>
            <label className="text-xs text-[#666] block mb-1">Booking URL (Calendly, Cal.com, etc.)</label>
            <input
              value={form.bookingUrl}
              onChange={(e) => setForm((f) => ({ ...f, bookingUrl: e.target.value }))}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
              placeholder="https://cal.com/yourname"
            />
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-xs text-[#555]">
            Payment is handled via your booking platform (Calendly, Cal.com, Razorpay etc.) — set your fee there directly.
          </div>
          {msg && <p className="text-red-400 text-xs">{msg}</p>}
          <div className="flex gap-3">
            <button
              onClick={submit}
              disabled={submitting || !form.expertName.trim() || !form.bio.trim() || !form.bookingUrl.trim()}
              className="px-4 py-2 bg-[#E8A838] text-black text-sm font-semibold rounded-lg hover:bg-[#f0b84a] transition disabled:opacity-50"
            >
              {submitting ? "Listing…" : "List Me"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-[#555] hover:text-white transition">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[#444] text-sm">Loading…</p>
      ) : slots.length === 0 ? (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-10 text-center">
          <p className="text-[#444] text-sm mb-2">No experts listed yet.</p>
          {authSession?.user
            ? <button onClick={() => setShowForm(true)} className="text-xs text-[#E8A838] hover:underline">Be the first →</button>
            : <a href="/login" className="text-xs text-[#E8A838] hover:underline">Sign in to list yourself →</a>
          }
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {slots.map((slot) => (
            <div key={slot.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-6 flex flex-col gap-4 hover:border-[#E8A838]/30 transition">
              <div>
                <p className="font-semibold text-white text-base">{slot.expertName}</p>
                <p className="text-[#555] text-xs mt-0.5 leading-relaxed">{slot.bio}</p>
              </div>
              {slot.expertise.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {slot.expertise.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8A838]/10 text-[#E8A838] border border-[#E8A838]/20">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-end mt-auto pt-3 border-t border-[#1a1a1a]">
                <a
                  href={slot.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 bg-[#E8A838] text-black text-xs font-semibold rounded-lg hover:bg-[#f0b84a] transition"
                >
                  Book Session
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
