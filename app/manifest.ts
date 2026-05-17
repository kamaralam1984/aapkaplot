import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AapKaPlot — AI Powered Real Estate",
    short_name: "AapKaPlot",
    description:
      "Find nearby plots, flats and houses with AI recommendations, live maps and satellite view.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#10b981",
    orientation: "portrait",
    categories: ["business", "lifestyle", "shopping"],
    lang: "en-IN",
    icons: [
      // Scalable SVG — modern browsers (Chrome, Edge, Firefox, Safari 16+)
      // pick this for every size so we don't ship PNG at every resolution.
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      // Auto-generated PNGs from app/icon.tsx + app/apple-icon.tsx are
      // exposed at /icon and /apple-icon — list them so older Android
      // launchers that ignore SVG manifests still find a raster.
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
