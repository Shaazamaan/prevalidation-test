import { NextRequest, NextResponse } from "next/server";
import { getReport, getSession } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const [report, session, adminSession] = await Promise.all([
    getReport(sessionId),
    getSession(sessionId),
    auth(),
  ]);

  if (!report || !session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = !!adminSession?.user;

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 190;
  let y = 20;

  const addLine = (text: string, size = 11, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, W);
    lines.forEach((line: string) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, 10, y);
      y += size * 0.5;
    });
    y += 3;
  };

  const verdictColor: Record<string, [number, number, number]> = {
    "READY": [0, 160, 80],
    "CONDITIONALLY READY": [200, 140, 0],
    "NOT READY": [200, 0, 0],
  };
  const [r, g, b] = verdictColor[report.verdict] ?? [100, 100, 100];

  addLine("Founder Readiness Check", 18, true);
  addLine(`Session: ${session.founderName}`, 12);
  addLine(`Date: ${new Date(session.createdAt).toLocaleDateString()}`, 11);
  y += 5;

  doc.setTextColor(r, g, b);
  addLine(`Verdict: ${report.verdict}`, 14, true);
  doc.setTextColor(0, 0, 0);

  addLine(report.verdictExplanation, 11);
  y += 4;

  addLine("What to Resolve Before Validation:", 13, true);
  report.mustResolveBeforeValidation.forEach((item) => addLine(`• ${item}`));
  y += 4;

  addLine("Kill Signals to Watch During Validation:", 13, true);
  report.killSignals.forEach((item) => addLine(`• ${item}`));
  y += 4;

  addLine("Final Summary:", 13, true);
  addLine(report.finalSummary);

  if (isAdmin) {
    y += 6;
    addLine("─── ADMIN ONLY ─────────────────────────", 10, true);

    addLine("Founder Stress Test — Solid:", 12, true);
    report.founderStressTest.solid.forEach((item) => addLine(`• ${item}`));

    addLine("Founder Stress Test — Gaps:", 12, true);
    report.founderStressTest.gaps.forEach((item) => addLine(`• ${item}`));

    addLine("Not Honest With Themselves About:", 12, true);
    report.founderStressTest.notHonestWith.forEach((item) => addLine(`• ${item}`));

    addLine("Project — Coherent:", 12, true);
    report.projectStressTest.coherent.forEach((item) => addLine(`• ${item}`));

    addLine("Project — Structural Weaknesses:", 12, true);
    report.projectStressTest.structuralWeaknesses.forEach((item) => addLine(`• ${item}`));

    addLine("Unexamined Assumptions:", 12, true);
    report.projectStressTest.unexaminedAssumptions.forEach((item) => addLine(`• ${item}`));

    addLine("What Founder Does Not Know:", 12, true);
    report.whatFounderDoesNotKnow.forEach((item) => addLine(`• ${item}`));

    addLine("Most Dangerous Assumptions:", 12, true);
    report.mostDangerousAssumptions.forEach((item) => addLine(`• ${item}`));
  }

  const pdfBytes = doc.output("arraybuffer");
  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="readiness-report-${sessionId.slice(0, 8)}.pdf"`,
    },
  });
}
