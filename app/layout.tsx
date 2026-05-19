import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import { LazyClient } from "@/components/layout/LazyClient";
import { VisitBeacon } from "@/components/layout/VisitBeacon";
import { ToastProvider } from "@/components/ui/Toast";
import { CompareDock } from "@/components/property/CompareDock";
import { GoogleAnalytics } from "@/components/seo/GoogleAnalytics";
import { GoogleAdSense } from "@/components/seo/GoogleAdSense";
import { JsonLd } from "@/components/seo/JsonLd";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { RouteProgress } from "@/components/ui/RouteProgress";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AapKaPlot — AI Powered Real Estate, Nearby Plots, Flats & Houses",
    template: "%s · AapKaPlot",
  },
  description:
    "India's AI powered real estate platform. Find nearby plots, flats, houses, commercial spaces and agricultural land with live maps, satellite view and verified owners.",
  keywords: [
    // Generic high-volume property searches.
    "real estate India",
    "property in India",
    "buy property",
    "rent flat",
    "plot near me",
    "buy plot",
    "houses for sale",
    "apartments for rent",
    "commercial property",
    "agricultural land",
    // Major Indian cities — match search demand.
    "flats in Kolkata",
    "flats in Bengaluru",
    "flats in Mumbai",
    "flats in Pune",
    "flats in Delhi",
    "property in Patna",
    "plot in Patna",
    "plot in Phulwari Sharif",
    "plot in Danapur",
    // Brand + USP.
    "verified real estate",
    "AI real estate",
    "satellite property view",
    "AapKaPlot",
    "Aap Ka Plot",
    "जमीन खरीदें",
    "प्लाट",
    "फ्लैट",
  ],
  applicationName: "AapKaPlot",
  authors: [{ name: "AapKaPlot" }],
  creator: "AapKaPlot",
  publisher: "AapKaPlot",
  category: "real estate",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["hi_IN"],
    url: siteUrl,
    siteName: "AapKaPlot",
    title: "AapKaPlot — Verified Plots, Flats & Houses in India",
    description:
      "Discover verified plots, flats and houses near you with live satellite view, instant WhatsApp leads and trust-scored owners.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AapKaPlot — Verified plots, flats and houses across India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@aapkaplot",
    creator: "@aapkaplot",
    title: "AapKaPlot — Verified Real Estate, Nearby Plots & Flats",
    description: "Live satellite property discovery for India. Verified owners, instant leads, AI-priced.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    // Set these in .env.local to expose the corresponding meta tags. Each
    // resolves to <meta name="...-site-verification" content="..."> so the
    // platform's "HTML tag" verification method works without uploading
    // anything extra.
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: {
      ...(process.env.AHREFS_SITE_VERIFICATION
        ? { "ahrefs-site-verification": process.env.AHREFS_SITE_VERIFICATION }
        : {}),
      ...(process.env.FACEBOOK_DOMAIN_VERIFICATION
        ? { "facebook-domain-verification": process.env.FACEBOOK_DOMAIN_VERIFICATION }
        : {}),
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <JsonLd />
        <GoogleAdSense />
      </head>
      <body className="min-h-screen bg-surface text-ink-900">
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <ToastProvider>
          {children}
          {/* CompareDock + CookieConsent + SW are never visible above the
              fold on first paint — defer their hydration to idle time so
              they stop competing with LCP / INP. */}
          <LazyClient>
            <CompareDock />
            <CookieConsent />
            <ServiceWorkerRegister />
            <VisitBeacon />
          </LazyClient>
        </ToastProvider>
      </body>
    </html>
  );
}
