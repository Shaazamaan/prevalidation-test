import { ImageResponse } from "next/og";
import { getPitchDeckSession } from "@/lib/db";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { id: string } }) {
  const session = await getPitchDeckSession(params.id);

  const founderName = session?.founderName ?? "Founder";
  const dbScore = session?.dbScore ?? "—";
  const grScore = session?.grScore ?? "—";
  const verdict = session?.overallVerdict ?? "Pitch Deck Analysis";
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
            Pitch Deck Analysis
          </div>
          <div style={{ fontSize: 48, color: "#ffffff", fontWeight: "bold", lineHeight: 1.1 }}>
            {verdict}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 14, color: "#444" }}>
            devbridgekerala.com
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div
              style={{
                background: "#1a1a1a",
                border: "1px solid #333",
                color: "#E8A838",
                borderRadius: 16,
                padding: "16px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 36, fontWeight: "bold" }}>{dbScore}</div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>DB Score</div>
            </div>
            <div
              style={{
                background: "#1a1a1a",
                border: "1px solid #333",
                color: "#60a5fa",
                borderRadius: 16,
                padding: "16px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 36, fontWeight: "bold" }}>{grScore}</div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>GR Score</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
