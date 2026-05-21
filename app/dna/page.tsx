import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDNAResult } from "@/lib/db";
import DNAQuiz from "@/components/DNAQuiz";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Startup DNA Quiz — Devbridge",
  description: "Discover your founder archetype in 12 questions. Are you a Visionary, Executor, Networker, or Builder?",
};

export default async function DNAPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/dna");

  const result = await getDNAResult(session.user.email);
  return <DNAQuiz initialResult={result} />;
}
