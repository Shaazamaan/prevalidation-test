import type { Metadata } from "next";
import { auth } from "@/auth";
import { getMatchProfile, getAllMatchProfiles, getSwipedEmails, getMatches } from "@/lib/db";
import MatchDeck from "@/components/MatchDeck";

export const metadata: Metadata = {
  title: "Find Co-founders — Devbridge Match",
  description: "Connect with Indian founders, co-founders, and startup team members. Swipe, match, and chat.",
};

export default async function MatchPage() {
  const session = await auth();
  const userEmail = session?.user?.email ?? null;

  const [allProfiles, myProfile, swipedMap, matches] = await Promise.all([
    getAllMatchProfiles(),
    userEmail ? getMatchProfile(userEmail) : Promise.resolve(null),
    userEmail ? getSwipedEmails(userEmail) : Promise.resolve({} as Record<string, "like" | "pass">),
    userEmail ? getMatches(userEmail) : Promise.resolve([] as string[]),
  ]);

  const unseen = userEmail
    ? allProfiles.filter((p) => p.email !== userEmail && !swipedMap[p.email])
    : allProfiles.slice(0, 5);

  return (
    <MatchDeck
      profiles={unseen}
      myProfile={myProfile}
      isAuthenticated={!!userEmail}
      userEmail={userEmail}
      matchCount={matches.length}
    />
  );
}
