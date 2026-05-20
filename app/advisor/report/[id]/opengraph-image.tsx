import { ImageResponse } from "next/og";
import { getAdvisorSession } from "@/lib/db";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { id: string } }) {
  const session = await getAdvisorSession(params.id);

  const founderName = session?.founderName ?? "Founder";
  const score = session?.overallScore ?? "—";
  const pathway = session?.pathway ?? "";
  const pathwayLabel = session?.pathwayLabel ?? "Startup Evaluation";
  const country = session?.country ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: 20, color: "#E8A838", letterSpacing: 4, textTransform: "uppercase" }}>
            DEVBRIDGE
          </div>
          <div style={{ fontSize: 16, color: "#555", textAlign: "right" }}>
            {founderName}
            {country ? `  ·  ${country}` : ""}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 14, color: "#E8A838", textTransform: "uppercase", letterSpacing: 3 }}>
            Startup Viability Report
          </div>
          <div style={{ fontSize: 48, color: "#ffffff", fontWeight: "bold", lineHeight: 1.1 }}>
            {pathwayLabel}
          </div>
          {pathway && (
            <div style={{ fontSize: 16, color: "#888" }}>{pathway}</div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 14, color: "#444" }}>
            devbridgekerala.com
          </div>
          <div
            style={{
              background: "#E8A838",
              color: "#000",
              borderRadius: 16,
              padding: "16px 28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 40, fontWeight: "bold" }}>{score}</div>
            <div style={{ fontSize: 14, marginTop: 2 }}>Overall Score</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
