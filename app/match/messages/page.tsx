import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMatches, getMatchProfile, getChatMessages } from "@/lib/db";
import MatchMessages from "@/components/MatchMessages";

export default async function MatchMessagesPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin/google?callbackUrl=/match/messages");

  const matchEmails = await getMatches(session.user.email);

  const matchData = await Promise.all(
    matchEmails.map(async (email) => {
      const [profile, messages] = await Promise.all([
        getMatchProfile(email),
        getChatMessages(session.user!.email!, email),
      ]);
      return { email, profile, messages };
    })
  );

  return (
    <MatchMessages
      myEmail={session.user.email}
      matches={matchData}
    />
  );
}
