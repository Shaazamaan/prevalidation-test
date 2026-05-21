import { ImageResponse } from "next/og";
import { getReport, getSession } from "@/lib/db";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: { sessionId: string } }) {
  const [session, report] = await Promise.all([
    getSession(params.sessionId),
    getReport(params.sessionId),
  ]);

  const score = report?.realityScore ?? 0;
  const verdict = report?.verdict ?? "NOT READY";
  const founderName = session?.founderName ?? "Founder";
  const idea = session?.startupIdea?.slice(0, 72) ?? "";
  const ideaText = idea.length === 72 ? idea + "…" : idea;

  const scoreColor = score >= 70 ? "#4ade80" : score >= 45 ? "#E8A838" : "#f87171";
  const verdictColor = verdict === "READY" ? "#4ade80" : verdict === "CONDITIONALLY READY" ? "#E8A838" : "#f87171";
  const bgAccent = verdict === "READY" ? "rgba(74,222,128,0.06)" : verdict === "CONDITIONALLY READY" ? "rgba(232,168,56,0.06)" : "rgba(248,113,113,0.06)";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0a0a0a",
        padding: "56px 64px",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "48px" }}>
        <span style={{ color: "#E8A838", fontSize: "18px", letterSpacing: "5px", textTransform: "uppercase", fontWeight: 600 }}>
          DEVBRIDGE
        </span>
        <span style={{ color: "#333", fontSize: "15px" }}>AI Startup Reality Check</span>
      </div>

      {/* Main row */}
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: "64px" }}>

        {/* Score circle */}
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: 110,
            border: `6px solid ${scoreColor}`,
            backgroundColor: bgAccent,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ color: scoreColor, fontSize: 84, fontWeight: 800, lineHeight: 1 }}>{score}</span>
          <span style={{ color: "#555", fontSize: 20, marginTop: 4 }}>/100</span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 200, backgroundColor: "#1a1a1a", flexShrink: 0 }} />

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>
          {/* Verdict badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 20px",
              borderRadius: 10,
              border: `1.5px solid ${verdictColor}44`,
              backgroundColor: `${verdictColor}11`,
              alignSelf: "flex-start",
            }}
          >
            <span style={{ color: verdictColor, fontSize: 22, fontWeight: 700 }}>{verdict}</span>
          </div>

          {/* Founder name */}
          <span style={{ color: "#cccccc", fontSize: 26, fontWeight: 600 }}>{founderName}</span>

          {/* Idea */}
          {ideaText && (
            <span style={{ color: "#555", fontSize: 17, lineHeight: 1.5 }}>{ideaText}</span>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px", paddingTop: "20px", borderTop: "1px solid #111" }}>
        <span style={{ color: "#333", fontSize: "15px" }}>Tap to see the full breakdown — gaps, assumptions, next steps</span>
        <span style={{ color: "#444", fontSize: "15px" }}>devbridgekerala.com</span>
      </div>
    </div>
  );
}
