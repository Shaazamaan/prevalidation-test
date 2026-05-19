import { NextRequest, NextResponse } from "next/server";
import { saveReport, getReport, updateSession } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import type { Report } from "@/lib/db";

const REQUIRED_KEYS: (keyof Report)[] = [
  "verdict",
  "verdictExplanation",
  "founderStressTest",
  "projectStressTest",
  "whatFounderDoesNotKnow",
  "mostDangerousAssumptions",
  "mustResolveBeforeValidation",
  "killSignals",
  "finalSummary",
];

export async function POST(req: NextRequest) {
  try {
    const { sessionId, reportJson } = await req.json();
    if (!sessionId || !reportJson) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    for (const key of REQUIRED_KEYS) {
      if (!(key in reportJson)) {
        return NextResponse.json({ error: `Missing report key: ${key}` }, { status: 400 });
      }
    }
    await saveReport(sessionId, reportJson as Report);
    await updateSession(sessionId, { status: "completed" });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const report = await getReport(sessionId);
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  if (isAdminRequest(req)) return NextResponse.json(report);

  return NextResponse.json({
    verdict: report.verdict,
    verdictExplanation: report.verdictExplanation,
    mustResolveBeforeValidation: report.mustResolveBeforeValidation,
    killSignals: report.killSignals,
    finalSummary: report.finalSummary,
  });
}
