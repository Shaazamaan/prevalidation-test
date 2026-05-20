"use client";
import { useState } from "react";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91 India" },
  { code: "+1", label: "🇺🇸 +1 USA/Canada" },
  { code: "+44", label: "🇬🇧 +44 UK" },
  { code: "+61", label: "🇦🇺 +61 Australia" },
  { code: "+65", label: "🇸🇬 +65 Singapore" },
  { code: "+971", label: "🇦🇪 +971 UAE" },
  { code: "+60", label: "🇲🇾 +60 Malaysia" },
  { code: "+49", label: "🇩🇪 +49 Germany" },
  { code: "+55", label: "🇧🇷 +55 Brazil" },
  { code: "+other", label: "Other" },
];

const INPUT = "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#E8A838] transition";

export default function ContactForm() {
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const valid = phone.trim().length >= 6 && email.trim().includes("@") && message.trim().length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode, phone, whatsapp, email, message }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const d = await res.json();
        setError(d.error ?? "Failed to send. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-white font-semibold mb-2">Message sent!</p>
        <p className="text-[#888] text-sm">We'll get back to you on WhatsApp or email soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">Phone Number <span className="text-red-500">*</span></label>
        <div className="flex gap-2">
          <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-2.5 text-white text-sm focus:outline-none focus:border-[#E8A838] transition w-36 shrink-0">
            {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="Phone number" className={INPUT} />
        </div>
      </div>
      <div>
        <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">WhatsApp Number (Optional)</label>
        <div className="flex gap-2">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[#555] text-sm w-36 shrink-0">{countryCode}</div>
          <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))} placeholder="WhatsApp (if different)" className={INPUT} />
        </div>
      </div>
      <div>
        <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">Email <span className="text-red-500">*</span></label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={INPUT} />
      </div>
      <div>
        <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">Message <span className="text-red-500">*</span></label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Describe your issue or question in detail…" className={`${INPUT} resize-none`} />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={!valid || loading}
        className="w-full bg-[#E8A838] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#d4962e] transition disabled:opacity-40 disabled:cursor-not-allowed">
        {loading ? "Sending…" : "Send Message →"}
      </button>
    </form>
  );
}
