import { redirect } from "next/navigation";
import { getAllSessions, getReport } from "@/lib/db";
import { isAdminServer } from "@/lib/admin-auth";
import AdminTable from "@/components/AdminTable";

export default async function DashboardPage() {
  if (!isAdminServer()) redirect("/admin");

  const sessions = await getAllSessions();
  const reports = await Promise.all(
    sessions.map((s) => getReport(s.id).catch(() => null))
  );

  const enriched = sessions.map((s, i) => ({
    ...s,
    report: reports[i] ?? null,
  }));

  const total = sessions.length;
  const completed = sessions.filter((s) => s.status === "completed").length;
  const active = sessions.filter((s) => s.status === "active").length;
  const ready = reports.filter((r) => r?.verdict === "READY").length;
  const conditionallyReady = reports.filter((r) => r?.verdict === "CONDITIONALLY READY").length;
  const notReady = reports.filter((r) => r?.verdict === "NOT READY").length;
  const thisWeek = sessions.filter(
    (s) => Date.now() - s.createdAt < 7 * 24 * 60 * 60 * 1000
  ).length;
  const avgReality = reports.filter(Boolean).length > 0
    ? Math.round(
        reports.filter(Boolean).reduce((sum, r) => sum + (r?.realityScore ?? 0), 0) /
        reports.filter(Boolean).length
      )
    : null;

  const stats = [
    { label: "Total", value: total },
    { label: "Completed", value: completed },
    { label: "In Progress", value: active },
    { label: "READY", value: ready },
    { label: "CONDITIONALLY", value: conditionallyReady },
    { label: "NOT READY", value: notReady },
    { label: "This Week", value: thisWeek },
    { label: "Avg Reality", value: avgReality !== null ? `${avgReality}/100` : "—" },
  ];

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

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#111] border border-[#222] rounded-xl p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-[#555] mt-1 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>

        <AdminTable sessions={enriched} />
      </div>
    </main>
  );
}
