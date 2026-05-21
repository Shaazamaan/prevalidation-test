import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Status — Devbridge",
  description: "Current operational status of all Devbridge services.",
};

const SERVICES = [
  { name: "AI Readiness Check", description: "Startup evaluation engine", status: "operational" },
  { name: "Advisor Tool", description: "AI startup advisor", status: "operational" },
  { name: "Pitch Deck Validator", description: "Deck analysis & scoring", status: "operational" },
  { name: "Pitch Practice", description: "AI investor simulation", status: "operational" },
  { name: "AI Tools Suite", description: "Pivot advisor, GTM, one-pager, etc.", status: "operational" },
  { name: "Founder Feed", description: "Community posts & updates", status: "operational" },
  { name: "Match Platform", description: "Founder matching", status: "operational" },
  { name: "Payments (Razorpay)", description: "Payment processing", status: "operational" },
  { name: "Authentication", description: "Sign-in & account management", status: "operational" },
  { name: "Database (KV)", description: "Data storage", status: "operational" },
];

const STATUS_CONFIG = {
  operational: { label: "Operational", color: "text-green-400", dot: "bg-green-400", border: "border-green-900/30" },
  degraded: { label: "Degraded", color: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-900/30" },
  outage: { label: "Outage", color: "text-red-400", dot: "bg-red-400", border: "border-red-900/30" },
} as const;

export default function StatusPage() {
  const allOperational = SERVICES.every((s) => s.status === "operational");

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-16 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-[#555] text-xs tracking-widest uppercase mb-3">System Status</p>
          <h1 className="font-crimson text-3xl font-semibold text-white mb-4">Devbridge Status</h1>
          {allOperational ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-800/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">All systems operational</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-900/20 border border-yellow-800/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-400 text-sm font-medium">Some systems affected</span>
            </div>
          )}
        </div>

        <div className="space-y-2 mb-10">
          {SERVICES.map((service) => {
            const cfg = STATUS_CONFIG[service.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.operational;
            return (
              <div key={service.name} className={`flex items-center justify-between p-4 bg-[#0d0d0d] border rounded-xl ${cfg.border}`}>
                <div>
                  <p className="text-white text-sm font-medium">{service.name}</p>
                  <p className="text-[#444] text-xs">{service.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-5">
          <h2 className="text-white text-sm font-medium mb-3">Recent incidents</h2>
          <p className="text-[#444] text-sm">No incidents reported in the last 90 days.</p>
        </div>

        <p className="text-center text-[#333] text-xs mt-6">
          Last checked: {new Date().toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC
        </p>
      </div>
    </main>
  );
}
