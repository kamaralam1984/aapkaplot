import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { NearbyRail } from "@/components/home/NearbyRail";
import { TopPicksStrip } from "@/components/home/TopPicksStrip";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { AIRecommendations } from "@/components/home/AIRecommendations";
import { HomepageAdSlot } from "@/components/home/HomepageAdSlot";
import { YouTubeRail } from "@/components/home/YouTubeRail";
import { MOCK_PROPERTIES, DEFAULT_ORIGIN } from "@/lib/mock-data";
import { withinRadius } from "@/lib/haversine";
import { findNearby, listProperties } from "@/lib/data/properties";
import { getLatestProperties, getSponsoredProperties, getBestDeals } from "@/lib/data/top-picks";
import { fetchChannelVideos } from "@/lib/youtube";
import type { Property } from "@/lib/types";

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
        <Hero />

        {/* Top picks: Best Deals → Sponsored → Just Added — sits between Hero and Nearby */}
        <TopPicksStrip
          latest={latest}
          sponsored={sponsored}
          bestDeals={bestDeals}
        />

        {/* Nearby property rail — sits directly under the hero map, like the screenshot */}
        <NearbyRail
          properties={nearby}
          title="Nearby Properties"
          subtitle="Closest matches near your location"
        />

        {/* Category quick-links row */}
        <CategoryGrid />

        {/* AI-recommended carousel + WhyUs side panel */}
        <AIRecommendations properties={aiPicks.length ? aiPicks : nearby} />

        {/* Latest YouTube videos from @aapkaplot */}
        <YouTubeRail videos={videos} />

        {/* Sponsored partners */}
        <HomepageAdSlot />
      </main>
      <Footer />

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
