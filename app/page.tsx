import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { NearbyRail } from "@/components/home/NearbyRail";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { AIRecommendations } from "@/components/home/AIRecommendations";
import { HomepageAdSlot } from "@/components/home/HomepageAdSlot";
import { MOCK_PROPERTIES, DEFAULT_ORIGIN } from "@/lib/mock-data";
import { withinRadius } from "@/lib/haversine";

export default function HomePage() {
  // Server-rendered initial pass with default origin — geo refines on client.
  const nearby = withinRadius(DEFAULT_ORIGIN, MOCK_PROPERTIES, 200).slice(0, 8);
  const aiPicks = MOCK_PROPERTIES.filter((p) => p.badges?.length).slice(0, 8);

  return (
    <>
      <Navbar />
      <main>
        <Hero />

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
