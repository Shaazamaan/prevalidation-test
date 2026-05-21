import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import {
  getAllSessions,
  getReport,
  getAllAdvisorSessions,
  getAllPitchDeckSessions,
  getPWAInstallCount,
  getAllCouponStats,
  getRazorpayMode,
  getAllAdminCoupons,
  getAllAgents,
  getAgentRevenue,
  getAgentClients,
  getAgentMessages,
  getAgentSubscriptionPrice,
  getAgentRazorpayPlanId,
  getAllBlogPosts,
  getContentItems,
  getAllBans,
  getAllBrainstormDocs,
  getAllPitchPracticeSessions,
} from "@/lib/db";
import { isAdminServer } from "@/lib/admin-auth";
import AdminDashboardClient from "@/components/AdminDashboardClient";
import type { Session, AdvisorSession, PitchDeckSession, Report, AdminCoupon, AgentProfile, AgentMessage, AgentClientEntry } from "@/lib/db";

export type { AdminCoupon, AgentProfile, AgentMessage, AgentClientEntry };

export type AgentDashData = {
  profile: AgentProfile;
  revenue: number;
  clientCount: number;
  clients: AgentClientEntry[];
  messages: AgentMessage[];
};

export type RepeatUser = {
  email: string;
  name: string;
  phone?: string;
  tools: string[];
  totalSpend: number; // paise
  sessionCount: number;
};

export type CountryStat = { country: string; count: number };
export type CouponStat = { code: string; count: number; emails: string[] };

export type DashboardAnalytics = {
  totalSessions: number;
  completedSessions: number;
  paidCount: number;
  freeCount: number;
  adminCount: number;
  totalRevenuePaise: number;
  revenueByTool: { readiness: number; advisor: number; pitchdeck: number };
  thisWeekTotal: number;
  thisMonthRevenuePaise: number;
  readinessCreated: number;
  readinessCompleted: number;
  advisorCount: number;
  pitchDeckCount: number;
  pwaInstalls: number;
  countries: CountryStat[];
  repeatUsers: RepeatUser[];
  couponStats: CouponStat[];
  razorpayMode: "test" | "live";
};

const getCachedSessionData = unstable_cache(
  async () => {
    const [readiness, advisor, pitchDeck] = await Promise.all([
      getAllSessions().catch(() => [] as Session[]),
      getAllAdvisorSessions().catch(() => [] as AdvisorSession[]),
      getAllPitchDeckSessions().catch(() => [] as PitchDeckSession[]),
    ]);
    return { readiness, advisor, pitchDeck };
  },
  ["admin-sessions"],
  { revalidate: 60, tags: ["admin-sessions"] }
);

export default async function DashboardPage() {
  if (!await isAdminServer()) redirect("/admin");

  const [{ readiness: readinessSessions, advisor: advisorSessions, pitchDeck: pitchDeckSessions }, pwaInstalls, couponStats, razorpayMode, adminCoupons, allAgents, agentSubPrice, agentPlanId, blogPosts, contentItems, allBans, brainstormDocs, pitchPracticeSessions] =
    await Promise.all([
      getCachedSessionData(),
      getPWAInstallCount().catch(() => 0),
      getAllCouponStats().catch(() => [] as { code: string; count: number; emails: string[] }[]),
      getRazorpayMode(),
      getAllAdminCoupons().catch(() => [] as AdminCoupon[]),
      getAllAgents().catch(() => [] as AgentProfile[]),
      getAgentSubscriptionPrice().catch(() => 29900),
      getAgentRazorpayPlanId().catch(() => null),
      getAllBlogPosts().catch(() => []),
      getContentItems().catch(() => []),
      getAllBans().catch(() => []),
      getAllBrainstormDocs().catch(() => []),
      getAllPitchPracticeSessions().catch(() => []),
    ]);

  const agentData: AgentDashData[] = await Promise.all(
    allAgents.map(async (a) => {
      const [revenue, clients, messages] = await Promise.all([
        getAgentRevenue(a.email).catch(() => 0),
        getAgentClients(a.email).catch(() => [] as AgentClientEntry[]),
        getAgentMessages(a.email).catch(() => [] as AgentMessage[]),
      ]);
      return { profile: a, revenue, clientCount: clients.length, clients, messages };
    })
  );

  const reports = await Promise.all(
    readinessSessions.map((s) => getReport(s.id).catch(() => null))
  );

  const enrichedReadiness = readinessSessions.map((s, i) => ({
    ...s,
    report: reports[i] ?? null,
  }));

  // ── Revenue calculation ─────────────────────────────────────────────────────
  function sessionRevenue(s: { payment?: { amount?: number; isFree?: boolean; isAdmin?: boolean } }) {
    if (!s.payment) return 0;
    return s.payment.amount ?? 0;
  }

  const readinessRevenue = readinessSessions
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + sessionRevenue(s), 0);
  const advisorRevenue = advisorSessions.reduce((sum, s) => sum + sessionRevenue(s), 0);
  const pitchDeckRevenue = pitchDeckSessions.reduce((sum, s) => sum + sessionRevenue(s), 0);
  const totalRevenuePaise = readinessRevenue + advisorRevenue + pitchDeckRevenue;

  const nowMs = Date.now();
  const thisWeekMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const thisMonthMs = nowMs - 30 * 24 * 60 * 60 * 1000;

  const thisWeekTotal =
    readinessSessions.filter((s) => s.createdAt > thisWeekMs).length +
    advisorSessions.filter((s) => s.createdAt > thisWeekMs).length +
    pitchDeckSessions.filter((s) => s.createdAt > thisWeekMs).length;

  const thisMonthRevenuePaise =
    readinessSessions.filter((s) => s.status === "completed" && s.createdAt > thisMonthMs)
      .reduce((sum, s) => sum + sessionRevenue(s), 0) +
    advisorSessions.filter((s) => s.createdAt > thisMonthMs)
      .reduce((sum, s) => sum + sessionRevenue(s), 0) +
    pitchDeckSessions.filter((s) => s.createdAt > thisMonthMs)
      .reduce((sum, s) => sum + sessionRevenue(s), 0);

  // ── Payment type breakdown ──────────────────────────────────────────────────
  const allCompleted = [
    ...readinessSessions.filter((s) => s.status === "completed"),
    ...advisorSessions,
    ...pitchDeckSessions,
  ];
  const paidCount = allCompleted.filter((s) => s.payment && !s.payment.isFree && !s.payment.isAdmin).length;
  const freeCount = allCompleted.filter((s) => s.payment?.isFree).length;
  const adminCount = allCompleted.filter((s) => s.payment?.isAdmin || !s.payment).length;

  // ── Country breakdown ────────────────────────────────────────────────────────
  const countryCounts: Record<string, number> = {};
  for (const s of [...readinessSessions, ...advisorSessions, ...pitchDeckSessions]) {
    const c = s.country ?? "Unknown";
    countryCounts[c] = (countryCounts[c] ?? 0) + 1;
  }
  const countries: CountryStat[] = Object.entries(countryCounts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // ── Repeat users (same email across tools) ──────────────────────────────────
  type UserEntry = { email: string; name: string; phone?: string; tool: string; amount: number };
  const emailMap: Record<string, UserEntry[]> = {};

  const addToMap = (
    sessions: (Session | AdvisorSession | PitchDeckSession)[],
    toolLabel: string
  ) => {
    for (const s of sessions) {
      if (!s.email) continue;
      const key = s.email.toLowerCase();
      if (!emailMap[key]) emailMap[key] = [];
      emailMap[key].push({
        email: s.email,
        name: s.founderName ?? "",
        phone: s.phone,
        tool: toolLabel,
        amount: s.payment?.amount ?? 0,
      });
    }
  };

  addToMap(readinessSessions.filter((s) => s.status === "completed"), "Readiness");
  addToMap(advisorSessions, "Advisor");
  addToMap(pitchDeckSessions, "Pitch Deck");

  const repeatUsers: RepeatUser[] = Object.entries(emailMap)
    .filter(([, entries]) => entries.length > 1)
    .map(([email, entries]) => ({
      email,
      name: entries[0].name ?? email,
      phone: entries[0].phone,
      tools: [...new Set(entries.map((e) => e.tool))],
      totalSpend: entries.reduce((s, e) => s + e.amount, 0),
      sessionCount: entries.length,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend);

  // ── Chart data (last 7 days) ─────────────────────────────────────────────────
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  });

  const dayCounts = Array.from({ length: 7 }, (_, i) => {
    const start = nowMs - (6 - i) * 86400000;
    const end = start + 86400000;
    return [
      ...readinessSessions.filter((s) => s.createdAt >= start && s.createdAt < end),
      ...advisorSessions.filter((s) => s.createdAt >= start && s.createdAt < end),
      ...pitchDeckSessions.filter((s) => s.createdAt >= start && s.createdAt < end),
    ].length;
  });

  const totalSessions = readinessSessions.length + advisorSessions.length + pitchDeckSessions.length;
  const readinessCompleted = readinessSessions.filter((s) => s.status === "completed").length;

  const analytics: DashboardAnalytics = {
    totalSessions,
    completedSessions: readinessCompleted + advisorSessions.length + pitchDeckSessions.length,
    paidCount,
    freeCount,
    adminCount,
    totalRevenuePaise,
    revenueByTool: {
      readiness: readinessRevenue,
      advisor: advisorRevenue,
      pitchdeck: pitchDeckRevenue,
    },
    thisWeekTotal,
    thisMonthRevenuePaise,
    readinessCreated: readinessSessions.length,
    readinessCompleted,
    advisorCount: advisorSessions.length,
    pitchDeckCount: pitchDeckSessions.length,
    pwaInstalls,
    countries,
    repeatUsers,
    couponStats,
    razorpayMode,
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-crimson text-2xl sm:text-3xl font-semibold text-white">Admin Dashboard</h1>
            <p className="text-[#555] text-xs mt-1">Devbridge · All activity, A–Z</p>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-sm text-[#666] hover:text-white transition">
              Sign out
            </button>
          </form>
        </div>

        <AdminDashboardClient
          readinessSessions={enrichedReadiness}
          advisorSessions={advisorSessions}
          pitchDeckSessions={pitchDeckSessions}
          analytics={analytics}
          days={days}
          dayCounts={dayCounts}
          adminCoupons={adminCoupons}
          agentData={agentData}
          agentSubPrice={agentSubPrice}
          agentPlanId={agentPlanId}
          blogPosts={blogPosts}
          contentItems={contentItems}
          allBans={allBans}
          brainstormDocs={brainstormDocs}
          pitchPracticeSessions={pitchPracticeSessions}
        />
      </div>
    </main>
  );
}
