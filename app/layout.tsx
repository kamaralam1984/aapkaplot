import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import { ToastProvider } from "@/components/ui/Toast";
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
    "real estate India",
    "plot near me",
    "flats in Kolkata",
    "buy property",
    "rent flat",
    "agricultural land",
    "AI real estate",
    "AapKaPlot",
  ],
  applicationName: "AapKaPlot",
  authors: [{ name: "AapKaPlot" }],
  creator: "AapKaPlot",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "AapKaPlot",
    title: "AapKaPlot — AI Powered Real Estate Platform",
    description:
      "Discover verified plots, flats and houses near you with live satellite view and AI recommendations.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AapKaPlot",
    description: "AI-powered nearby property discovery for India.",
  },
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true },
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
      <body className="min-h-screen bg-surface text-ink-900">
        <ToastProvider>{children}</ToastProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
