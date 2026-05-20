import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy — Devbridge",
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-[#555] text-sm hover:text-[#E8A838] transition mb-8 block">
          ← Back to Home
        </Link>

        <h1 className="font-crimson text-4xl text-white mb-2">Refund Policy</h1>
        <p className="text-[#555] text-sm mb-10">Last updated: May 2025</p>

        <div className="space-y-8 text-[#888] text-sm leading-relaxed">
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">Our Policy</h2>
            <p>
              Devbridge provides digital AI-generated reports. Because the service is delivered
              immediately upon payment, our general policy is <strong className="text-[#aaa]">no refunds
              once a report has been successfully generated</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">When We Issue Refunds</h2>
            <p>We will issue a full refund in the following cases:</p>
            <ul className="list-disc pl-5 space-y-3 mt-3">
              <li>
                <strong className="text-[#aaa]">Payment successful but no report generated:</strong>{" "}
                If your payment was charged but the system failed to produce a report (confirmed by
                our server logs), you are entitled to a full refund or a free retry.
              </li>
              <li>
                <strong className="text-[#aaa]">Double charge:</strong> If you were charged twice for
                the same report due to a technical error, we will refund the duplicate charge.
              </li>
              <li>
                <strong className="text-[#aaa]">Service unavailability:</strong> If our AI services
                were completely unavailable for more than 24 hours during your paid session period,
                you may request a refund.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">When We Do Not Issue Refunds</h2>
            <ul className="list-disc pl-5 space-y-3 mt-3">
              <li>
                <strong className="text-[#aaa]">Dissatisfaction with the report content:</strong>{" "}
                AI evaluations are advisory in nature. We cannot issue refunds if you disagree with
                the verdict or assessment.
              </li>
              <li>
                <strong className="text-[#aaa]">Change of mind:</strong> Refunds are not issued for
                reports that were successfully generated.
              </li>
              <li>
                <strong className="text-[#aaa]">Incorrect information submitted:</strong> If you
                submitted incorrect or incomplete answers and the report reflects that, no refund
                is applicable.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">How to Request a Refund</h2>
            <p>
              <Link href="/contact" className="text-[#E8A838] hover:underline">Contact us here</Link> with:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Your Razorpay Payment ID (found in your payment confirmation email)</li>
              <li>Your Session ID or the email used</li>
              <li>A brief description of the issue</li>
            </ul>
            <p className="mt-3">
              We will review your request within <strong className="text-[#aaa]">3 business days</strong> and
              process eligible refunds within 5–7 business days via your original payment method.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">Payment Gateway</h2>
            <p>
              All payments are processed by Razorpay. Refunds initiated by us are returned through
              Razorpay to your original payment source. Processing times may vary by bank or UPI
              provider (typically 5–10 business days).
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">Contact</h2>
            <p>
              For any refund-related queries, <Link href="/contact" className="text-[#E8A838] hover:underline">contact us here</Link>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-[#1a1a1a] flex gap-4 text-xs text-[#444]">
          <Link href="/privacy-policy" className="hover:text-[#888] transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#888] transition">Terms of Service</Link>
          <Link href="/" className="hover:text-[#888] transition">Home</Link>
        </div>
      </div>
    </main>
  );
}
