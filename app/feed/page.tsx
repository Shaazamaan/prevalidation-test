import { auth } from "@/auth";
import FounderFeed from "@/components/FounderFeed";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founder Feed — Devbridge",
  description: "Anonymous wins, learnings, and questions from Indian startup founders.",
};

export default async function FeedPage() {
  const session = await auth();
  return <FounderFeed isAuthenticated={!!session?.user?.email} />;
}
