import { ImageResponse } from "next/og";

// Auto-generated 1200×630 social-share card. Picked up by:
//   • Open Graph (Facebook, LinkedIn, WhatsApp, Telegram, Slack)
//   • Twitter when summary_large_image is set in the metadata config
// Per-route opengraph-image.tsx files can override this for property
// detail pages, blog posts, etc.

export const runtime = "edge";
export const alt = "AapKaPlot — AI-powered real estate platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          padding: "72px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #831843 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 72,
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #10b981 0%, #6366f1 60%, #f472b6 100%)",
              borderRadius: 18,
              boxShadow: "0 8px 28px rgba(16,185,129,0.45)",
            }}
          >
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 11.5L12 3l9 8.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"
                stroke="white"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -0.5 }}>
            Aap<span style={{ color: "#34d399" }}>KaPlot</span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            marginTop: "auto",
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -1.2,
          }}
        >
          Find your next address,
          <br />
          <span style={{ color: "#34d399" }}>discovered by AI.</span>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 36,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          <span>Verified plots, flats &amp; houses · live satellite view</span>
          <span style={{ fontWeight: 700, color: "white" }}>aapkaplot.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
