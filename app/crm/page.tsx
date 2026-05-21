import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getInvestorCRM } from "@/lib/db";
import InvestorCRM from "@/components/InvestorCRM";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investor CRM — Devbridge",
  description: "Track your investor outreach, follow-ups, and pipeline in one place.",
};

export default async function CRMPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/crm");
  const contacts = await getInvestorCRM(session.user.email);
  return <InvestorCRM initialContacts={contacts} />;
}
