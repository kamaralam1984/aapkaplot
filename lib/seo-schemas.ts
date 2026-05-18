/**
 * JSON-LD schema generators. Used inline in route metadata so Google,
 * Bing, and ChatGPT-Search agents can parse property + page metadata
 * without scraping the visual DOM.
 */

interface BreadcrumbStep {
  name: string;
  url: string;
}

export function breadcrumbSchema(steps: BreadcrumbStep[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: steps.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      item: s.url,
    })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Stock FAQs reused on every city / locality page. India-specific. */
export const CITY_FAQS = [
  {
    q: "Are listings on AapKaPlot verified?",
    a: "Yes. Every listing goes through an admin moderation queue before going live. Sellers can also complete Aadhaar / PAN verification to earn a 'Verified Owner' badge.",
  },
  {
    q: "Do buyers pay any fee to use AapKaPlot?",
    a: "No. Browsing, contacting owners, and making offers is free for buyers. Sellers can optionally pay for boost / featured placement.",
  },
  {
    q: "How does the AI-powered search work?",
    a: "We rank listings by proximity to your GPS location, verified-owner status, freshness, and price competitiveness in the locality. You can sort by distance, price, or trust score.",
  },
  {
    q: "Can I post agricultural land or commercial property?",
    a: "Yes — AapKaPlot supports plots, flats, houses, villas, shops, offices, warehouses, and agricultural land across India.",
  },
  {
    q: "How do I contact the property owner directly?",
    a: "On any property page, click 'Show Phone Number' to reveal the owner's contact, or use WhatsApp / in-app chat to negotiate.",
  },
];

export function realEstateListingSchema(p: {
  id: string;
  title: string;
  description: string;
  priceInr: number;
  areaSqft: number;
  locality: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  coverUrl: string;
  gallery?: string[];
  postedAt: string;
  verified?: boolean;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${siteUrl}/property/${p.id}`,
    name: p.title,
    description: p.description,
    url: `${siteUrl}/property/${p.id}`,
    image: [p.coverUrl, ...(p.gallery ?? [])].filter(Boolean).slice(0, 8),
    datePosted: p.postedAt,
    offers: {
      "@type": "Offer",
      price: p.priceInr,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      ...(p.verified ? { itemCondition: "https://schema.org/NewCondition" } : {}),
    },
    floorSize: {
      "@type": "QuantitativeValue",
      value: p.areaSqft,
      unitText: "sqft",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: p.locality,
      addressRegion: p.state,
      addressCountry: "IN",
      streetAddress: `${p.locality}, ${p.city}`,
    },
    geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng },
  };
}
