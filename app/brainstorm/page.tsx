import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getBrainstorm } from "@/lib/db";
import BrainstormBoard from "@/components/BrainstormBoard";

export default async function BrainstormPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/brainstorm");

  const doc = await getBrainstorm(session.user.email);
  return (
    <BrainstormBoard
      email={session.user.email}
      initialDoc={doc ?? { email: session.user.email, notes: "", todos: [], updatedAt: 0 }}
    />
  );
}
