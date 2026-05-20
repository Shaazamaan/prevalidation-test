import { redirect } from "next/navigation";
import { getAllSessions, getReport, getAllAdvisorSessions, getAllPitchDeckSessions } from "@/lib/db";
import { isAdminServer } from "@/lib/admin-auth";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export default async function DashboardPage() {
  if (!isAdminServer()) redirect("/admin");

  const [readinessSessions, advisorSessions, pitchDeckSessions] = await Promise.all([
    getAllSessions(),
    getAllAdvisorSessions(),
    getAllPitchDeckSessions(),
  ]);

  const reports = await Promise.all(
    readinessSessions.map((s) => getReport(s.id).catch(() => null))
  );

  const enrichedReadiness = readinessSessions.map((s, i) => ({
    ...s,
    report: reports[i] ?? null,
  }));

  // Analytics
  const totalSessions = readinessSessions.length + advisorSessions.length + pitchDeckSessions.length;
  const completedReadiness = readinessSessions.filter((s) => s.status === "completed").length;
  const paidCount = completedReadiness + advisorSessions.length + pitchDeckSessions.length;
  const revenue = paidCount * 999;
  const conversionRate = totalSessions > 0
    ? Math.round((paidCount / totalSessions) * 100)
    : 0;

  const thisWeek = (Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekTotal =
    readinessSessions.filter((s) => s.createdAt > thisWeek).length +
    advisorSessions.filter((s) => s.createdAt > thisWeek).length +
    pitchDeckSessions.filter((s) => s.createdAt > thisWeek).length;

  const analytics = {
    totalSessions,
    paidCount,
    revenue,
    conversionRate,
    thisWeekTotal,
    readinessCount: readinessSessions.length,
    advisorCount: advisorSessions.length,
    pitchDeckCount: pitchDeckSessions.length,
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="font-crimson text-2xl sm:text-3xl font-semibold text-white">Admin Dashboard</h1>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-sm text-[#666] hover:text-white transition">
              Sign out
            </button>
          </form>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalSessions}</div>
            <div className="text-xs text-[#555] mt-1">Total Sessions</div>
          </div>
          <div className="bg-[#111] border border-[#E8A838]/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#E8A838]">₹{revenue.toLocaleString("en-IN")}</div>
            <div className="text-xs text-[#555] mt-1">Revenue</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{conversionRate}%</div>
            <div className="text-xs text-[#555] mt-1">Conversion Rate</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{thisWeekTotal}</div>
            <div className="text-xs text-[#555] mt-1">This Week</div>
          </div>
        </div>

        {/* Tool popularity */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-white">{analytics.readinessCount}</div>
            <div className="text-xs text-[#555] mt-1">Readiness Check</div>
            <div className="mt-2 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E8A838] rounded-full"
                style={{ width: totalSessions > 0 ? `${(analytics.readinessCount / totalSessions) * 100}%` : "0%" }}
              />
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-white">{analytics.advisorCount}</div>
            <div className="text-xs text-[#555] mt-1">Advisor</div>
            <div className="mt-2 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: totalSessions > 0 ? `${(analytics.advisorCount / totalSessions) * 100}%` : "0%" }}
              />
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-white">{analytics.pitchDeckCount}</div>
            <div className="text-xs text-[#555] mt-1">Pitch Deck</div>
            <div className="mt-2 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: totalSessions > 0 ? `${(analytics.pitchDeckCount / totalSessions) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>

        <AdminDashboardClient
          readinessSessions={enrichedReadiness}
          advisorSessions={advisorSessions}
          pitchDeckSessions={pitchDeckSessions}
        />
      </div>
    </main>
  );
}
