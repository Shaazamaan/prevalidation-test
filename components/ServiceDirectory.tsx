"use client";

import { useState } from "react";

const CATS_ALL = ["legal", "finance", "design", "development", "marketing", "hr", "other"] as const;
const BLANK_FORM = { name: "", category: "other" as Category, speciality: "", location: "", bio: "", website: "" };

type Category = "legal" | "finance" | "design" | "development" | "marketing" | "hr" | "other";

type ServiceProvider = {
  id: string;
  name: string;
  category: Category;
  speciality: string;
  location: string;
  bio: string;
  website?: string;
  email: string;
  verified: boolean;
  addedAt: number;
};

const CAT_CONFIG: Record<Category, { label: string; color: string }> = {
  legal: { label: "Legal", color: "text-blue-400 border-blue-800/40" },
  finance: { label: "Finance", color: "text-green-400 border-green-800/40" },
  design: { label: "Design", color: "text-purple-400 border-purple-800/40" },
  development: { label: "Dev", color: "text-cyan-400 border-cyan-800/40" },
  marketing: { label: "Marketing", color: "text-orange-400 border-orange-800/40" },
  hr: { label: "HR", color: "text-pink-400 border-pink-800/40" },
  other: { label: "Other", color: "text-[#555] border-[#333]" },
};

const ALL_CATS: Category[] = ["legal", "finance", "design", "development", "marketing", "hr", "other"];

export default function ServiceDirectory({ providers: initial, userEmail }: { providers: ServiceProvider[]; userEmail: string | null }) {
  const [filterCat, setFilterCat] = useState<Category | "all">("all");
  const [providers, setProviders] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const alreadyListed = providers.some((p) => p.email === userEmail);
  const filtered = providers.filter((p) => filterCat === "all" || p.category === filterCat);

  const submit = async () => {
    if (!form.name.trim() || !form.bio.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/directory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setProviders((prev) => [data.provider, ...prev]);
      setShowForm(false);
      setForm({ ...BLANK_FORM });
    } else {
      setMsg(data.error ?? "Error submitting");
      setTimeout(() => setMsg(""), 3000);
    }
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-1">Community</p>
            <h1 className="font-crimson text-2xl sm:text-3xl font-semibold text-white mb-1">Service Directory</h1>
            <p className="text-[#555] text-xs">Service providers from the founder community — legal, finance, design, and more.</p>
          </div>
          {userEmail && !alreadyListed && (
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-[#E8A838] text-black text-sm font-semibold rounded-lg hover:bg-[#f0b84a] transition shrink-0">
              List Your Service
            </button>
          )}
          {!userEmail && (
            <a href="/login" className="text-xs text-[#E8A838] hover:underline self-center">Sign in to list yourself →</a>
          )}
        </div>

        {/* Self-listing form */}
        {showForm && (
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5 mb-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Your Service Profile</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#666] block mb-1">Display name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50" placeholder="Your name or company" />
              </div>
              <div>
                <label className="text-xs text-[#666] block mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                  className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50">
                  {CATS_ALL.map((c) => <option key={c} value={c}>{CAT_CONFIG[c].label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#666] block mb-1">Speciality</label>
                <input value={form.speciality} onChange={(e) => setForm((f) => ({ ...f, speciality: e.target.value }))}
                  className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50" placeholder="e.g. Startup contracts, Tax filing" />
              </div>
              <div>
                <label className="text-xs text-[#666] block mb-1">Location</label>
                <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50" placeholder="e.g. Bangalore / Remote" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-1">Short bio</label>
              <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={2} className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50 resize-none" placeholder="What you do and who you help..." />
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-1">Website (optional)</label>
              <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50" placeholder="https://..." />
            </div>
            {msg && <p className="text-red-400 text-xs">{msg}</p>}
            <div className="flex gap-3">
              <button onClick={submit} disabled={submitting || !form.name.trim() || !form.bio.trim()}
                className="px-4 py-2 bg-[#E8A838] text-black text-sm font-semibold rounded-lg hover:bg-[#f0b84a] transition disabled:opacity-50">
                {submitting ? "Listing…" : "List Me"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-sm text-[#555] hover:text-white transition">Cancel</button>
            </div>
          </div>
        )}

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setFilterCat("all")}
            className={`text-[10px] px-3 py-1.5 rounded-full border transition ${filterCat === "all" ? "bg-[#E8A838]/10 border-[#E8A838]/50 text-[#E8A838]" : "border-[#222] text-[#555] hover:border-[#333]"}`}
          >
            All
          </button>
          {ALL_CATS.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(filterCat === c ? "all" : c)}
              className={`text-[10px] px-3 py-1.5 rounded-full border transition ${filterCat === c ? "bg-[#E8A838]/10 border-[#E8A838]/50 text-[#E8A838]" : "border-[#222] text-[#555] hover:border-[#333]"}`}
            >
              {CAT_CONFIG[c].label}
            </button>
          ))}
        </div>

        {/* Providers grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#333] text-sm">No providers in this category yet.</p>
            <p className="text-[#333] text-xs mt-1">Check back soon — we add new providers regularly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((p) => {
              const cfg = CAT_CONFIG[p.category];
              const contactHref = p.website ? p.website : `mailto:${p.email}`;
              return (
                <div key={p.id} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium">{p.name}</span>
                        {p.verified && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full border text-green-400 border-green-800/40">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-[10px] text-[#444]">{p.speciality}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[#444] text-xs mb-1">{p.location}</p>
                  <p className="text-[#666] text-xs mb-3 line-clamp-3 flex-1">{p.bio}</p>
                  <a
                    href={contactHref}
                    target={p.website ? "_blank" : undefined}
                    rel={p.website ? "noopener noreferrer" : undefined}
                    className="bg-[#E8A838] text-black text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#d4962e] transition text-center"
                  >
                    Contact
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
