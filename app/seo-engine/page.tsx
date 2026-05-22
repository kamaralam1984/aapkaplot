import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SeoEngineClient } from "./SeoEngineClient";

export const metadata: Metadata = {
  title: "AI SEO Growth Engine — AapKaPlot",
  description: "Analyze, fix, rank & go viral automatically with AI-powered SEO.",
  alternates: { canonical: "/seo-engine" },
};

export default function SeoEnginePage() {
  return (
    <>
      <Navbar />
      <SeoEngineClient />
      <Footer />
    </>
  );
}
