"use client";

import { useState } from "react";

type JobType = "full_time" | "part_time" | "contract" | "co_founder" | "intern";

type JobListing = {
  id: string;
  title: string;
  company: string;
  posterEmail: string;
  type: JobType;
  remote: boolean;
  location?: string;
  description: string;
  skills: string[];
  equity?: string;
  salary?: string;
  applyUrl?: string;
  applyEmail?: string;
  postedAt: number;
  expiresAt: number;
  active: boolean;
};

const TYPE_CONFIG: Record<JobType, { label: string; color: string }> = {
  full_time: { label: "Full-time", color: "text-green-400 border-green-800/40" },
  part_time: { label: "Part-time", color: "text-blue-400 border-blue-800/40" },
  contract: { label: "Contract", color: "text-purple-400 border-purple-800/40" },
  co_founder: { label: "Co-founder", color: "text-[#E8A838] border-[#E8A838]/40" },
  intern: { label: "Intern", color: "text-pink-400 border-pink-800/40" },
};

const ALL_TYPES: JobType[] = ["full_time", "part_time", "contract", "co_founder", "intern"];

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const BLANK = {
  title: "", company: "", type: "full_time" as JobType, remote: false,
  location: "", description: "", skills: "", equity: "", salary: "",
  applyUrl: "", applyEmail: "",
};

export default function JobBoard({
  allJobs: initial,
  myJobs: initialMy,
  userEmail,
}: {
  allJobs: JobListing[];
  myJobs: JobListing[];
  userEmail: string | null;
}) {
  const [jobs, setJobs] = useState<JobListing[]>(initial);
  const [myJobs, setMyJobs] = useState<JobListing[]>(initialMy);
  const [filterType, setFilterType] = useState<JobType | "all">("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = jobs.filter((j) => {
    if (filterType !== "all" && j.type !== filterType) return false;
    if (remoteOnly && !j.remote) return false;
    return true;
  });

  const postJob = async () => {
    if (!form.title.trim() || !form.company.trim() || !form.description.trim()) {
      setError("Title, company, and description are required.");
      return;
    }
    if (!form.applyUrl.trim() && !form.applyEmail.trim()) {
      setError("Provide either an apply URL or apply email.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean) }),
    });
    const d = await res.json() as { job?: JobListing; error?: string };
    if (d.job) {
      setJobs((prev) => [d.job!, ...prev]);
      setMyJobs((prev) => [d.job!, ...prev]);
      setShowForm(false);
      setForm({ ...BLANK });
    } else {
      setError(d.error ?? "Failed to post job.");
    }
    setSaving(false);
  };

  const deleteJob = async (id: string) => {
    await fetch("/api/jobs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setMyJobs((prev) => prev.filter((j) => j.id !== id));
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-1">Community</p>
            <h1 className="font-crimson text-2xl sm:text-3xl font-semibold text-white mb-1">Job Board</h1>
            <p className="text-[#555] text-xs">{jobs.length} active listing{jobs.length !== 1 ? "s" : ""} from the Devbridge community</p>
          </div>
          {userEmail ? (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="bg-[#E8A838] text-black text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#d4962e] transition shrink-0"
            >
              + Post a Job
            </button>
          ) : (
            <a href="/login?callbackUrl=/jobs" className="bg-[#E8A838] text-black text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#d4962e] transition shrink-0">
              Sign in to Post
            </a>
          )}
        </div>

        {/* Post Job Form */}
        {showForm && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 mb-5">
            <p className="text-sm font-medium text-white mb-4">Post a new listing</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {([ ["Title *", "title", "Senior Backend Engineer"], ["Company *", "company", "My Startup"] ] as [string, string, string][]).map(([label, key, ph]) => (
                <div key={key}>
                  <label className="text-[10px] text-[#444] block mb-1">{label}</label>
                  <input
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={ph}
                    className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-[#444] block mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as JobType }))}
                  className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {ALL_TYPES.map((t) => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <label className="text-[10px] text-[#444] block mb-1">Remote?</label>
                <button
                  onClick={() => setForm((f) => ({ ...f, remote: !f.remote }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${form.remote ? "bg-green-900/30 border-green-700/50 text-green-400" : "border-[#222] text-[#555]"}`}
                >
                  {form.remote ? "Remote" : "On-site"}
                </button>
              </div>
              <div>
                <label className="text-[10px] text-[#444] block mb-1">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Bangalore, India"
                  className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="text-[10px] text-[#444] block mb-1">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="What you'll be working on, responsibilities, requirements..."
                className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50 resize-none"
              />
            </div>
            <div className="mb-3">
              <label className="text-[10px] text-[#444] block mb-1">Skills (comma-separated)</label>
              <input
                value={form.skills}
                onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
                placeholder="React, Node.js, TypeScript"
                className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {([ ["Equity", "equity", "0.5–1%"], ["Salary", "salary", "₹12–18 LPA"] ] as [string, string, string][]).map(([label, key, ph]) => (
                <div key={key}>
                  <label className="text-[10px] text-[#444] block mb-1">{label}</label>
                  <input
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={ph}
                    className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {([ ["Apply URL", "applyUrl", "https://forms.gle/..."], ["Apply Email", "applyEmail", "careers@startup.com"] ] as [string, string, string][]).map(([label, key, ph]) => (
                <div key={key}>
                  <label className="text-[10px] text-[#444] block mb-1">{label}</label>
                  <input
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={ph}
                    className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50"
                  />
                </div>
              ))}
            </div>
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <div className="flex gap-2">
              <button onClick={postJob} disabled={saving} className="flex-1 py-2 bg-[#E8A838] text-black text-xs font-medium rounded-lg hover:bg-[#d4962e] transition disabled:opacity-50">
                {saving ? "Posting…" : "Post Listing"}
              </button>
              <button onClick={() => { setShowForm(false); setError(""); }} className="flex-1 py-2 border border-[#333] text-[#666] text-xs rounded-lg hover:border-[#555] transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilterType("all")}
            className={`text-[10px] px-3 py-1.5 rounded-full border transition ${filterType === "all" ? "bg-[#E8A838]/10 border-[#E8A838]/50 text-[#E8A838]" : "border-[#222] text-[#555] hover:border-[#333]"}`}
          >
            All
          </button>
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(filterType === t ? "all" : t)}
              className={`text-[10px] px-3 py-1.5 rounded-full border transition ${filterType === t ? "bg-[#E8A838]/10 border-[#E8A838]/50 text-[#E8A838]" : "border-[#222] text-[#555] hover:border-[#333]"}`}
            >
              {TYPE_CONFIG[t].label}
            </button>
          ))}
          <button
            onClick={() => setRemoteOnly((v) => !v)}
            className={`text-[10px] px-3 py-1.5 rounded-full border transition ${remoteOnly ? "bg-green-900/20 border-green-700/50 text-green-400" : "border-[#222] text-[#555] hover:border-[#333]"}`}
          >
            Remote only
          </button>
        </div>

        {/* Job Listings */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#333] text-sm">No listings match your filters.</p>
            {jobs.length === 0 && <p className="text-[#333] text-xs mt-1">Be the first to post a role in the community.</p>}
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {filtered.map((job) => {
              const cfg = TYPE_CONFIG[job.type];
              const waShare = `https://wa.me/?text=${encodeURIComponent(`Hiring: ${job.title} at ${job.company} — Apply on Devbridge`)}`;
              const liShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://devbridge.in/jobs`)}`;
              return (
                <div key={job.id} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-white text-sm font-medium">{job.title}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                        {job.remote && <span className="text-[9px] px-2 py-0.5 rounded-full border text-green-400 border-green-800/40">Remote</span>}
                      </div>
                      <p className="text-[#555] text-xs mb-1">{job.company}{job.location && !job.remote ? ` · ${job.location}` : ""}</p>
                      <p className="text-[#666] text-xs mb-2 line-clamp-2">{job.description}</p>
                      {job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {job.skills.slice(0, 5).map((s) => (
                            <span key={s} className="text-[9px] px-2 py-0.5 rounded-full border border-[#222] text-[#444]">{s}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 text-[10px] text-[#444]">
                        {job.salary && <span>Salary: {job.salary}</span>}
                        {job.equity && <span>Equity: {job.equity}</span>}
                        <span>Posted {fmtDate(job.postedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {job.applyUrl ? (
                      <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="bg-[#E8A838] text-black text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#d4962e] transition">
                        Apply Now
                      </a>
                    ) : job.applyEmail ? (
                      <a href={`mailto:${job.applyEmail}`} className="bg-[#E8A838] text-black text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#d4962e] transition">
                        Email to Apply
                      </a>
                    ) : null}
                    <a href={waShare} target="_blank" rel="noopener noreferrer" className="border border-[#333] text-[#666] text-xs px-3 py-2 rounded-lg hover:border-[#555] transition">
                      Share on WA
                    </a>
                    <a href={liShare} target="_blank" rel="noopener noreferrer" className="border border-[#333] text-[#666] text-xs px-3 py-2 rounded-lg hover:border-[#555] transition">
                      Share on LinkedIn
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* My Listings */}
        {userEmail && myJobs.length > 0 && (
          <div>
            <p className="text-[#444] text-xs uppercase tracking-widest mb-3">Your listings</p>
            <div className="space-y-2">
              {myJobs.map((job) => (
                <div key={job.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white text-xs font-medium">{job.title}</p>
                    <p className="text-[#555] text-[10px]">{job.company} · {TYPE_CONFIG[job.type].label} · expires {fmtDate(job.expiresAt)}</p>
                  </div>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="text-[10px] text-[#333] hover:text-red-400 transition shrink-0"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
