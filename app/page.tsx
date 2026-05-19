import nextDynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { NearbyRail } from "@/components/home/NearbyRail";
import { TopPicksStrip } from "@/components/home/TopPicksStrip";
import { AiAssistantShowcase } from "@/components/home/AiAssistantShowcase";
import { WhyChooseSection } from "@/components/home/WhyChooseSection";
import { MapLocationSection } from "@/components/home/MapLocationSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { LeadCaptureSection } from "@/components/home/LeadCaptureSection";
import { StickyWhatsApp } from "@/components/layout/StickyWhatsApp";
import { FloatingChatBot } from "@/components/layout/FloatingChatBot";
// Below-the-fold sections — load on demand so the initial JS bundle stays
// small. These never appear above the viewport on first paint, so deferring
// them removes them from the LCP / INP critical path.
const CategoryGrid = nextDynamic(() =>
  import("@/components/home/CategoryGrid").then((m) => ({ default: m.CategoryGrid }))
);
const AIRecommendations = nextDynamic(() =>
  import("@/components/home/AIRecommendations").then((m) => ({ default: m.AIRecommendations }))
);
const HomepageAdSlot = nextDynamic(() =>
  import("@/components/home/HomepageAdSlot").then((m) => ({ default: m.HomepageAdSlot }))
);
const YouTubeRail = nextDynamic(() =>
  import("@/components/home/YouTubeRail").then((m) => ({ default: m.YouTubeRail }))
);
import { MOCK_PROPERTIES, DEFAULT_ORIGIN } from "@/lib/mock-data";
import { withinRadius } from "@/lib/haversine";
import { findNearby, listProperties } from "@/lib/data/properties";
import { getLatestProperties, getSponsoredProperties, getBestDeals } from "@/lib/data/top-picks";
import { fetchChannelVideos } from "@/lib/youtube";
import type { Property } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Avoid full-route caching so toggling USE_DB takes effect on next request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Server-rendered initial pass with default origin — geo refines on client.
  let nearby: Property[];
  let aiPicks: Property[];
  let latest: Property[] = [];
  let sponsored: Property[] = [];
  let bestDeals: Property[] = [];

  const videos = await fetchChannelVideos(5).catch(() => []);

  try {
    const [nearbyRows, all, latestRows, sponsoredRows, dealRows] = await Promise.all([
      findNearby({ lat: DEFAULT_ORIGIN.lat, lng: DEFAULT_ORIGIN.lng, radiusKm: 200, limit: 8 }),
      listProperties(),
      getLatestProperties(8),
      getSponsoredProperties(8),
      getBestDeals(8),
    ]);
    nearby = nearbyRows.slice(0, 8);
    aiPicks = all.filter((p) => p.badges?.length).slice(0, 8);
    latest = latestRows;
    sponsored = sponsoredRows;
    bestDeals = dealRows;
    if (nearby.length === 0) {
      // DB returned nothing yet (fresh install) — fall back to mock so the
      // page never renders empty rails during onboarding.
      nearby = withinRadius(DEFAULT_ORIGIN, MOCK_PROPERTIES, 200).slice(0, 8);
      aiPicks = MOCK_PROPERTIES.filter((p) => p.badges?.length).slice(0, 8);
    }
  } catch (err) {
    console.error("[home] data_fetch_failed, falling back to mock", err);
    nearby = withinRadius(DEFAULT_ORIGIN, MOCK_PROPERTIES, 200).slice(0, 8);
    aiPicks = MOCK_PROPERTIES.filter((p) => p.badges?.length).slice(0, 8);
  }

  return (
    <>
      <Navbar />
      <main>
        {/* 1. Hero — headline + search + CTAs */}
        <Hero />

        {/* 2. AI Chat Assistant feature showcase */}
        <AiAssistantShowcase />

        {/* 3. Featured Properties — Best Deals, Sponsored, Just Added rails */}
        <TopPicksStrip
          latest={latest}
          sponsored={sponsored}
          bestDeals={bestDeals}
        />
        <NearbyRail
          properties={nearby}
          title="Nearby Properties"
          subtitle="Closest matches near your location"
        />

        {/* Category quick-links row */}
        <CategoryGrid />

        {/* 4. Why Choose AapKaPlot */}
        <WhyChooseSection />

        {/* 5. Map & Location intelligence */}
        <MapLocationSection />

        {/* AI-recommended carousel */}
        <AIRecommendations properties={aiPicks.length ? aiPicks : nearby} />

        {/* 6. YouTube property videos */}
        <YouTubeRail videos={videos} />

        {/* 8. Testimonials */}
        <TestimonialsSection />

        {/* 7. Lead capture inquiry form */}
        <LeadCaptureSection />

        {/* Sponsored partners */}
        <HomepageAdSlot />
      </main>
      <Footer />

      {/* Extra: sticky WhatsApp + AI chatbot widgets — global, every page */}
      <StickyWhatsApp />
      <FloatingChatBot />

      {/* JSON-LD: organization + website */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "AapKaPlot",
              url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com",
              logo: "/logo.svg",
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com",
              name: "AapKaPlot",
              potentialAction: {
                "@type": "SearchAction",
                target: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com"}/search?q={query}`,
                "query-input": "required name=query",
              },
            },
          ]),
        }}
      />
    </>
  );
}
