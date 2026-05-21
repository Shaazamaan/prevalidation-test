import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getBuddyRequest, getAllBuddyRequests } from "@/lib/db";
import BuddyMatcher from "@/components/BuddyMatcher";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buddy System — Devbridge",
  description: "Find an accountability buddy matched from the Devbridge founder community.",
};

export const dynamic = "force-dynamic";

export default async function BuddyPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const [myRequest, allRequests] = await Promise.all([
    getBuddyRequest(session.user.email),
    getAllBuddyRequests(),
  ]);

  let buddyProfile = null;
  if (myRequest?.matchedWith) {
    buddyProfile = allRequests.find((r) => r.email === myRequest.matchedWith) ?? null;
  }

  const totalWaiting = allRequests.filter((r) => !r.matchedWith && r.email !== session.user!.email).length;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-4 py-20 max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-2">Devbridge</p>
        <h1 className="text-3xl font-bold mb-2">Accountability Buddy</h1>
        <p className="text-[#666] text-sm">Get matched with another founder at your stage for weekly check-ins.</p>
      </div>
      <BuddyMatcher
        myRequest={myRequest}
        buddyProfile={buddyProfile}
        totalWaiting={totalWaiting}
        userEmail={session.user.email}
        userName={session.user.name ?? ""}
      />
    </main>
  );
}
