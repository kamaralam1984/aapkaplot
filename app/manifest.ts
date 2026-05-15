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
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
