import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Devbridge",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-[#555] text-sm hover:text-[#E8A838] transition mb-8 block">
          ← Back to Home
        </Link>

        <h1 className="font-crimson text-4xl text-white mb-2">Privacy Policy</h1>
        <p className="text-[#555] text-sm mb-10">Last updated: May 2025</p>

        <div className="space-y-8 text-[#888] text-sm leading-relaxed">
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">1. Who We Are</h2>
            <p>
              Devbridge ("we", "us", "our") operates this platform, which provides AI-powered startup
              readiness evaluations, viability assessments, and pitch deck analysis. Our services are
              accessible at this website and its subpages.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information when you use our services:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-[#aaa]">Profile Information:</strong> Your name, startup idea, and startup type provided when starting a session.</li>
              <li><strong className="text-[#aaa]">Questionnaire Responses:</strong> Your answers to evaluation questions, stored to generate your report.</li>
              <li><strong className="text-[#aaa]">Uploaded Files:</strong> Pitch deck files (PDF or images) uploaded for evaluation. These are processed in memory and not stored permanently.</li>
              <li><strong className="text-[#aaa]">Payment Information:</strong> Payment transactions are processed by Razorpay. We receive only a payment confirmation (order ID, payment ID, signature) and do not store card or bank details.</li>
              <li><strong className="text-[#aaa]">Usage Data:</strong> Session metadata including timestamps and a hashed IP address (not the raw IP) for fraud prevention.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To generate your AI evaluation report.</li>
              <li>To store your report so you can access it later via your session link.</li>
              <li>To improve our evaluation quality and fix technical issues.</li>
              <li>To verify payment before generating reports.</li>
              <li>To detect and prevent abuse or fraudulent usage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">4. Data Storage & Retention</h2>
            <p>
              Sessions and reports are stored securely using Vercel KV (powered by Upstash Redis).
              Data is retained for <strong className="text-[#aaa]">90 days</strong> from the date of creation,
              after which it is automatically deleted. We do not archive or sell session data.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">5. AI Processing</h2>
            <p>
              Your answers and uploaded files are sent to third-party AI providers (Anthropic Claude,
              Google Gemini, Groq, NVIDIA) for evaluation. These providers process your data under
              their respective privacy policies and do not retain your data for training without
              explicit consent. We use API access only (not consumer products).
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">6. Payment Processing</h2>
            <p>
              Payments are processed by <strong className="text-[#aaa]">Razorpay</strong>, a PCI-DSS compliant
              payment gateway. We never see or store your payment credentials. Razorpay's privacy policy
              governs how your payment data is handled.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">7. Data Sharing</h2>
            <p>
              We do not sell or rent your personal data. We share data only with:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>AI providers (for evaluation generation, as described above).</li>
              <li>Razorpay (for payment processing).</li>
              <li>Vercel and Upstash (for hosting and data storage infrastructure).</li>
              <li>Law enforcement or regulatory bodies if required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">8. Your Rights</h2>
            <p>
              You have the right to request deletion of your session data at any time. Contact us at
              the email below with your session ID. We will delete your data within 7 business days.
              Note: once deleted, your report cannot be recovered.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">9. Cookies</h2>
            <p>
              We use minimal session cookies for authentication (admin access only) and do not use
              advertising cookies or third-party tracking pixels.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">10. Contact</h2>
            <p>
              For privacy-related requests or questions, contact us at{" "}
              <span className="text-[#E8A838]">support@devbridge.in</span>. We respond within 5 business days.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-[#1a1a1a] flex gap-4 text-xs text-[#444]">
          <Link href="/terms" className="hover:text-[#888] transition">Terms of Service</Link>
          <Link href="/refund-policy" className="hover:text-[#888] transition">Refund Policy</Link>
          <Link href="/" className="hover:text-[#888] transition">Home</Link>
        </div>
      </div>
    </main>
  );
}
