import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAgent, getAgentClients, getAgentRevenue, getAgentMessages, getAgentCoupons } from "@/lib/db";
import AgentDashboard from "@/components/AgentDashboard";

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const agent = await getAgent(session.user.email);

  if (!agent) redirect("/agent/register");

  if (agent.status === "pending") {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-white text-xl font-semibold mb-2">Application Pending</h1>
          <p className="text-[#666] text-sm leading-relaxed">
            Your agent application is under review. We typically approve within 24–48 hours. You'll have full dashboard access once approved.
          </p>
        </div>
      </main>
    );
  }

  if (agent.status === "banned") {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-white text-xl font-semibold mb-2">Account Suspended</h1>
          <p className="text-[#666] text-sm">Your agent account has been suspended. Contact us if you believe this is an error.</p>
        </div>
      </main>
    );
  }

  const [clients, revenue, messages, coupons] = await Promise.all([
    getAgentClients(agent.email),
    getAgentRevenue(agent.email),
    getAgentMessages(agent.email),
    getAgentCoupons(agent.email),
  ]);

  const siteUrl = (process.env.NEXTAUTH_URL ?? "https://devbridgekerala.com").replace(/\/$/, "");

  return (
    <AgentDashboard
      agent={agent}
      clients={clients}
      revenue={revenue}
      messages={messages}
      coupons={coupons}
      siteUrl={siteUrl}
      userName={session.user.name ?? agent.name}
      userPicture={session.user.image ?? undefined}
    />
  );
}
