import { auth } from "@/auth";
import { getAllJobListings, getUserJobListings } from "@/lib/db";
import JobBoard from "@/components/JobBoard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Board — Devbridge",
  description: "Find startup jobs, co-founders, and contract roles posted by the Devbridge community.",
};

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const session = await auth();
  const email = session?.user?.email ?? null;

  const [allJobs, myJobs] = await Promise.all([
    getAllJobListings(),
    email ? getUserJobListings(email) : Promise.resolve([]),
  ]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-4 py-20 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-[#E8A838] text-xs uppercase tracking-widest mb-2">Devbridge</p>
        <h1 className="text-3xl font-bold mb-2">Job Board</h1>
        <p className="text-[#666] text-sm">Startup jobs, co-founder roles, and contract work posted by the community.</p>
      </div>
      <JobBoard allJobs={allJobs} myJobs={myJobs} userEmail={email} />
    </main>
  );
}
