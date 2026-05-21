import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getJournalEntries } from "@/lib/db";
import WeeklyJournal from "@/components/WeeklyJournal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weekly Journal — Devbridge",
  description: "Reflect on your week as a founder. Track what you shipped, learned, and what's blocking you.",
};

function getWeekKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export default async function JournalPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/journal");

  const entries = await getJournalEntries(session.user.email);
  const currentWeek = getWeekKey();

  return <WeeklyJournal initialEntries={entries} currentWeek={currentWeek} />;
}
