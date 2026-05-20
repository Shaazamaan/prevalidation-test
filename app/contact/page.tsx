import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Support — Devbridge",
  description: "Get instant support from the Devbridge team. Send us a message and we'll get back to you right away.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-[#555] text-sm hover:text-[#E8A838] transition mb-6 block">← Devbridge</Link>
        <div className="mb-8">
          <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-2">Support</p>
          <h1 className="font-crimson text-4xl text-white mb-3">Talk to Us</h1>
          <p className="text-[#888] text-sm">
            Fill in the form below and we'll get back to you on WhatsApp or email within a few hours.
          </p>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-5 sm:p-7">
          <ContactForm />
        </div>
        <div className="mt-6 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4">
          <p className="text-xs text-[#444]">We typically respond within 2–4 hours during business hours (IST).</p>
        </div>
        <footer className="mt-8 text-center text-xs text-[#333]">
          <div className="flex justify-center gap-4">
            <Link href="/privacy-policy" className="hover:text-[#555] transition">Privacy</Link>
            <Link href="/terms" className="hover:text-[#555] transition">Terms</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
