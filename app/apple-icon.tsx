import { ImageResponse } from "next/og";

// iOS / iPadOS home-screen icon. Apple uses this when a user "Add to Home
// Screen"-s the site. Solid background (Apple applies its own rounding +
// mask) keeps the brand identity recognisable on a black home-screen too.

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #10b981 0%, #6366f1 60%, #f472b6 100%)",
        }}
      >
        <svg width="118" height="118" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 11.5L12 3l9 8.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"
            stroke="white"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
