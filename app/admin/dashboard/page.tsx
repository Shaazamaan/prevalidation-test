import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllSessions, getReport } from "@/lib/db";
import AdminTable from "@/components/AdminTable";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

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
  const ready = reports.filter((r) => r?.verdict === "READY").length;
  const notReady = reports.filter((r) => r?.verdict === "NOT READY").length;
  const thisWeek = sessions.filter(
    (s) => Date.now() - s.createdAt < 7 * 24 * 60 * 60 * 1000
  ).length;

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-crimson text-3xl font-semibold text-white">Admin Dashboard</h1>
          <a
            href="/api/auth/signout"
            className="text-sm text-[#666] hover:text-white transition"
          >
            Sign out
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total", value: total },
            { label: "Completed", value: completed },
            { label: "READY", value: ready },
            { label: "NOT READY", value: notReady },
            { label: "This Week", value: thisWeek },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#111] border border-[#222] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-[#666] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <AdminTable sessions={enriched} />
      </div>
    </main>
  );
}
