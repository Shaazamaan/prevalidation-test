import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDNAResult, saveDNAResult, type DNAResult, type DNAArchetype } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await getDNAResult(session.user.email);
  return NextResponse.json({ result });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { answers: number[] };
  const answers = body.answers;

  if (!Array.isArray(answers) || answers.length !== 12) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  // Questions 1-3 = visionary, 4-6 = executor, 7-9 = networker, 10-12 = builder
  const visionary = answers[0] + answers[1] + answers[2];
  const executor = answers[3] + answers[4] + answers[5];
  const networker = answers[6] + answers[7] + answers[8];
  const builder = answers[9] + answers[10] + answers[11];

  const scores = { visionary, executor, networker, builder };
  const maxScore = Math.max(visionary, executor, networker, builder);

  let archetype: DNAArchetype = "Visionary";
  if (maxScore === executor) archetype = "Executor";
  else if (maxScore === networker) archetype = "Networker";
  else if (maxScore === builder) archetype = "Builder";
  // visionary wins ties

  const result: DNAResult = { archetype, scores, takenAt: Date.now() };
  await saveDNAResult(session.user.email, result);
  return NextResponse.json({ result });
}
