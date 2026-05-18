/**
 * Renders Organization + WebSite SearchAction JSON-LD in the document head.
 * Google parses these for the knowledge panel, sitelinks search box, and
 * brand attribution. Inlined as <script type="application/ld+json"> per
 * Google's recommendation.
 */
export function JsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";

  const organization = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "AapKaPlot",
    alternateName: "Aap Ka Plot",
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    image: `${siteUrl}/opengraph-image`,
    description:
      "India's verified real estate platform. Discover plots, flats, houses, commercial spaces and agricultural land with live satellite maps and trust-scored owners.",
    foundingDate: "2025",
    areaServed: [
      { "@type": "Country", name: "India" },
      { "@type": "City", name: "Patna" },
      { "@type": "City", name: "Kolkata" },
      { "@type": "City", name: "Bengaluru" },
      { "@type": "City", name: "Mumbai" },
      { "@type": "City", name: "Pune" },
      { "@type": "City", name: "Delhi" },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
      addressRegion: "Bihar",
    },
    sameAs: [
      "https://www.facebook.com/aapkaplot",
      "https://twitter.com/aapkaplot",
      "https://www.instagram.com/aapkaplot",
      "https://www.linkedin.com/company/aapkaplot",
      "https://www.youtube.com/@aapkaplot",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${siteUrl}/contact`,
      email: "support@aapkaplot.com",
      availableLanguage: ["en", "hi"],
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AapKaPlot",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
