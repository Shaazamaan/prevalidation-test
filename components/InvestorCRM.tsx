"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

type InvestorContact = {
  id: string;
  name: string;
  firm: string;
  email?: string;
  linkedIn?: string;
  stage: string;
  status: "to_contact" | "contacted" | "meeting_scheduled" | "passed" | "term_sheet";
  contactedOn?: number;
  followUpOn?: number;
  notes: string;
  addedAt: number;
  updatedAt: number;
};

const STATUS_CONFIG: Record<InvestorContact["status"], { label: string; color: string }> = {
  to_contact: { label: "To Contact", color: "text-[#555] border-[#333]" },
  contacted: { label: "Contacted", color: "text-blue-400 border-blue-800/40" },
  meeting_scheduled: { label: "Meeting", color: "text-[#E8A838] border-[#E8A838]/40" },
  passed: { label: "Passed", color: "text-red-400 border-red-800/40" },
  term_sheet: { label: "Term Sheet", color: "text-green-400 border-green-800/40" },
};

const STATUS_ORDER: InvestorContact["status"][] = ["to_contact", "contacted", "meeting_scheduled", "term_sheet", "passed"];

function fmtDate(ms?: number) {
  if (!ms) return "";
  return new Date(ms).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

const BLANK: Omit<InvestorContact, "id" | "addedAt" | "updatedAt"> = {
  name: "", firm: "", email: "", linkedIn: "", stage: "angel",
  status: "to_contact", notes: "", contactedOn: undefined, followUpOn: undefined,
};

export default function InvestorCRM({ initialContacts }: { initialContacts: InvestorContact[] }) {
  const [contacts, setContacts] = useState<InvestorContact[]>(initialContacts);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<InvestorContact["status"] | "all">("all");

  const filtered = contacts.filter((c) => filterStatus === "all" || c.status === filterStatus);
  const overdue = contacts.filter((c) => c.followUpOn && c.followUpOn < Date.now() && c.status !== "passed" && c.status !== "term_sheet");

  const openNew = () => { setForm({ ...BLANK }); setEditId(null); setShowForm(true); };
  const openEdit = (c: InvestorContact) => { setForm({ name: c.name, firm: c.firm, email: c.email ?? "", linkedIn: c.linkedIn ?? "", stage: c.stage, status: c.status, notes: c.notes, contactedOn: c.contactedOn, followUpOn: c.followUpOn }); setEditId(c.id); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim() || !form.firm.trim()) return;
    setSaving(true);
    if (editId) {
      const res = await fetch("/api/crm", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...form }) });
      const d = await res.json() as { contact?: InvestorContact };
      if (d.contact) setContacts((prev) => prev.map((c) => c.id === editId ? d.contact! : c));
    } else {
      const res = await fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json() as { contact?: InvestorContact };
      if (d.contact) setContacts((prev) => [d.contact!, ...prev]);
    }
    setShowForm(false);
    setSaving(false);
  };

  const del = async (id: string) => {
    await fetch("/api/crm", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const pipeline = STATUS_ORDER.map((s) => ({ status: s, count: contacts.filter((c) => c.status === s).length }));

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-14 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[#E8A838] text-xs tracking-widest uppercase mb-1">Investor CRM</p>
            <h1 className="font-crimson text-2xl sm:text-3xl font-semibold text-white">Your fundraising pipeline</h1>
          </div>
          <button onClick={openNew} className="text-xs px-3 py-2 bg-[#E8A838] text-black font-medium rounded-lg hover:bg-[#d4962e] transition">
            + Add investor
          </button>
        </div>

        {/* Pipeline summary */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {pipeline.map(({ status, count }) => (
            <div key={status} className={`bg-[#111] border rounded-xl p-3 text-center cursor-pointer transition ${filterStatus === status ? "border-[#E8A838]/50" : "border-[#1a1a1a] hover:border-[#333]"}`} onClick={() => setFilterStatus((f) => f === status ? "all" : status)}>
              <div className="text-xl font-bold text-white">{count}</div>
              <div className={`text-[9px] mt-0.5 ${STATUS_CONFIG[status].color.split(" ")[0]}`}>{STATUS_CONFIG[status].label}</div>
            </div>
          ))}
        </div>

        {/* Overdue follow-ups */}
        {overdue.length > 0 && (
          <div className="mb-4 px-4 py-3 bg-yellow-950/30 border border-yellow-800/30 rounded-xl">
            <p className="text-yellow-400 text-xs font-medium mb-1">⏰ {overdue.length} overdue follow-up{overdue.length > 1 ? "s" : ""}</p>
            <p className="text-[#666] text-xs">{overdue.map((c) => c.name).join(", ")}</p>
          </div>
        )}

        {/* Add/Edit form */}
        {showForm && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 mb-4">
            <p className="text-sm font-medium text-white mb-4">{editId ? "Edit investor" : "Add investor"}</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[["Name *", "name", "Rahul Tiwari"], ["Firm *", "firm", "Sequoia India"], ["Email", "email", "rahul@sequoia.com"], ["LinkedIn", "linkedIn", "linkedin.com/in/..."]].map(([label, key, ph]) => (
                <div key={key}>
                  <label className="text-[10px] text-[#444] block mb-1">{label}</label>
                  <input value={(form as Record<string, string | undefined>)[key] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={ph} className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#E8A838]/50" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-[#444] block mb-1">Stage</label>
                <select value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))} className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white focus:outline-none">
                  {["angel", "seed", "series_a", "series_b", "family_office"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#444] block mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as InvestorContact["status"] }))} className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white focus:outline-none">
                  {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#444] block mb-1">Follow-up date</label>
                <input type="date" value={form.followUpOn ? new Date(form.followUpOn).toISOString().split("T")[0] : ""} onChange={(e) => setForm((f) => ({ ...f, followUpOn: e.target.value ? new Date(e.target.value).getTime() : undefined }))} className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
              </div>
            </div>
            <div className="mb-3">
              <label className="text-[10px] text-[#444] block mb-1">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Warm intro via X, focuses on B2B SaaS..." className="w-full bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#333] focus:outline-none resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="flex-1 py-2 bg-[#E8A838] text-black text-xs font-medium rounded-lg hover:bg-[#d4962e] transition disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-[#333] text-[#666] text-xs rounded-lg hover:border-[#555] transition">Cancel</button>
            </div>
          </div>
        )}

        {/* Contact list */}
        {filtered.length === 0 ? (
          <p className="text-[#333] text-sm text-center py-12">{contacts.length === 0 ? "No investors yet. Start building your pipeline." : "No contacts in this stage."}</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => {
              const cfg = STATUS_CONFIG[c.status];
              const isOverdue = c.followUpOn && c.followUpOn < Date.now() && c.status !== "passed" && c.status !== "term_sheet";
              return (
                <div key={c.id} className={`bg-[#111] border rounded-xl p-4 transition ${isOverdue ? "border-yellow-800/40" : "border-[#1a1a1a]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium">{c.name}</span>
                        <span className="text-[#555] text-xs">{c.firm}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-[9px] text-[#333]">{c.stage}</span>
                      </div>
                      {c.notes && <p className="text-[#555] text-xs mt-1 truncate">{c.notes}</p>}
                      <div className="flex gap-3 mt-1">
                        {c.contactedOn && <span className="text-[10px] text-[#333]">Contacted {fmtDate(c.contactedOn)}</span>}
                        {c.followUpOn && <span className={`text-[10px] ${isOverdue ? "text-yellow-400" : "text-[#333]"}`}>Follow-up {fmtDate(c.followUpOn)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEdit(c)} className="text-[10px] text-[#444] hover:text-white transition">Edit</button>
                      <button onClick={() => del(c.id)} className="text-[10px] text-[#333] hover:text-red-400 transition">Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
