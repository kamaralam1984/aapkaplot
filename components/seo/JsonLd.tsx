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
    "@type": "Organization",
    name: "AapKaPlot",
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    description:
      "India's AI-powered real estate platform. Discover verified plots, flats and houses with live satellite maps.",
    sameAs: [] as string[],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${siteUrl}/contact`,
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
