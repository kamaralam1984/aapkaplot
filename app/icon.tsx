import { ImageResponse } from "next/og";

// Browser tab favicon. Next.js auto-serves this at /icon when the file
// exists, and links it from every page's <head>. 32×32 is the sweet spot
// — large enough to read on hi-DPI, small enough to stay crisp at 16 px.

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #10b981 0%, #6366f1 60%, #f472b6 100%)",
          borderRadius: 7,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 11.5L12 3l9 8.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"
            stroke="white"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
