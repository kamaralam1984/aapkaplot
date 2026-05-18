import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "api.mapbox.com" },
      // ImgBB CDN — seller uploads.
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "image.ibb.co" },
      // YouTube thumbnails (channel feed rail).
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "i3.ytimg.com" },
      // Avatar seed data.
      { protocol: "https", hostname: "i.pravatar.cc" },
      // Google profile photos (OAuth).
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
  // Friendly top-level kind URLs (footer / nav shortcuts) → /search?kind=...
  // Keeps the URL space tidy without spinning up a page per kind.
  async redirects() {
    return [
      { source: "/plot",        destination: "/search?kind=plot",        permanent: false },
      { source: "/plots",       destination: "/search?kind=plot",        permanent: false },
      { source: "/flat",        destination: "/search?kind=flat",        permanent: false },
      { source: "/flats",       destination: "/search?kind=flat",        permanent: false },
      { source: "/house",       destination: "/search?kind=house",       permanent: false },
      { source: "/houses",      destination: "/search?kind=house",       permanent: false },
      { source: "/independent", destination: "/search?kind=house",       permanent: false },
      { source: "/villa",       destination: "/search?kind=villa",       permanent: false },
      { source: "/villas",      destination: "/search?kind=villa",       permanent: false },
      { source: "/shop",        destination: "/search?kind=shop",        permanent: false },
      { source: "/shops",       destination: "/search?kind=shop",        permanent: false },
      { source: "/office",      destination: "/search?kind=office",      permanent: false },
      { source: "/offices",     destination: "/search?kind=office",      permanent: false },
      { source: "/warehouse",   destination: "/search?kind=warehouse",   permanent: false },
      { source: "/warehouses",  destination: "/search?kind=warehouse",   permanent: false },
      { source: "/commercial",  destination: "/search?intent=sell&kind=shop", permanent: false },
      { source: "/agriculture", destination: "/search?kind=agriculture", permanent: false },
      { source: "/agri",        destination: "/search?kind=agriculture", permanent: false },
    ];
  },
};

export default nextConfig;
