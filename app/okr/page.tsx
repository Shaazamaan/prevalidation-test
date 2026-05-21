import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOKRs } from "@/lib/db";
import OKRTracker from "@/components/OKRTracker";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OKR Tracker — Devbridge",
  description: "Set and track quarterly objectives and key results for your startup.",
};

export default async function OKRPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/okr");

  const okrs = await getOKRs(session.user.email);
  return <OKRTracker initialOKRs={okrs} />;
}
