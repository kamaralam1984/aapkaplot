import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

import { Breadcrumbs } from "@/components/property/Breadcrumbs";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertyHeader } from "@/components/property/PropertyHeader";
import { PropertyFacts } from "@/components/property/PropertyFacts";
import { PropertyAbout } from "@/components/property/PropertyAbout";
import { PropertyAmenities } from "@/components/property/PropertyAmenities";
import { PropertyLocation } from "@/components/property/PropertyLocation";
import { PropertyAINearby } from "@/components/property/PropertyAINearby";
import { PropertyNeighbourhoodNarrative } from "@/components/property/PropertyNeighbourhoodNarrative";
import { PropertyAIInsights } from "@/components/property/PropertyAIInsights";
import { PropertyOwnerCard } from "@/components/property/PropertyOwnerCard";
import { ScheduleVisitForm } from "@/components/property/ScheduleVisitForm";
import { MobileStickyCTA } from "@/components/property/MobileStickyCTA";
import { EMICalculator } from "@/components/property/EMICalculator";
import { PropertyReviews } from "@/components/property/PropertyReviews";
import { MakeOfferModal } from "@/components/property/MakeOfferModal";
import { NearbyRail } from "@/components/home/NearbyRail";

import {
  getAllPropertyIds,
  getPropertyDetail,
  getSimilarProperties,
} from "@/lib/property-detail";
import { loadPropertyDetailFromDb } from "@/lib/property-detail-db";
import type { PropertyDetail } from "@/lib/types";

/**
 * Mock-first, DB-fallback resolver. Mock has the rich seed catalogue we
 * use during development; DB hosts real seller-created listings.
 */
async function resolveProperty(id: string): Promise<PropertyDetail | null> {
  const fromMock = getPropertyDetail(id);
  if (fromMock) return fromMock;
  return loadPropertyDetailFromDb(id);
}
import { withinRadius } from "@/lib/haversine";
import { formatInr } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Re-render at most once per minute so DB-backed listings reflect edits
// quickly — the previous "static-by-default" behaviour cached an old
// areaSqft=0 render and never picked up subsequent updates.
export const revalidate = 60;

export async function generateStaticParams() {
  return getAllPropertyIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await resolveProperty(id);
  if (!property) {
    return { title: "Property not found" };
  }
  const title = `${property.title}${property.bhk ? ` · ${property.bhk} BHK` : ""} in ${property.location.locality}, ${property.location.city}`;
  const description = `${formatInr(property.priceInr)} · ${property.areaSqft} sqft · ${property.location.locality}, ${property.location.city}. ${property.description.slice(0, 140)}…`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: property.media.cover ? [{ url: property.media.cover, width: 1200, height: 630 }] : undefined,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: property.media.cover ? [property.media.cover] : undefined,
    },
    alternates: { canonical: `/property/${property.id}` },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const property = await resolveProperty(id);
  if (!property) notFound();

  const similar = getSimilarProperties(property.id, 8);
  const similarWithDistance = withinRadius(property.location.coords, similar, 200);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: property.location.city, href: `/city/${property.location.city.toLowerCase()}` },
    { label: property.location.locality, href: `/locality/${property.location.locality.toLowerCase().replace(/\s+/g, "-")}` },
    { label: property.title },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: property.title,
    description: property.description,
    image: property.media.gallery ?? [property.media.cover],
    address: {
      "@type": "PostalAddress",
      streetAddress: property.location.locality,
      addressLocality: property.location.city,
      addressRegion: property.location.state,
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: property.location.coords.lat,
      longitude: property.location.coords.lng,
    },
    floorSize: {
      "@type": "QuantitativeValue",
      value: property.areaSqft,
      unitCode: "FTK",
    },
    numberOfRooms: property.features.bedrooms,
    offers: {
      "@type": "Offer",
      price: property.priceInr,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com"}/property/${property.id}`,
    },
  };

  return (
    <>
      <Navbar />
      <main className="pb-28 lg:pb-16">
        <Container size="wide">
          <Breadcrumbs items={breadcrumbs} />

          <div className="mt-4">
            <PropertyGallery
              gallery={
                property.media.gallery && property.media.gallery.length > 0
                  ? property.media.gallery
                  : [property.media.cover]
              }
              videoUrl={property.videoUrl}
              youtubeUrl={property.youtubeUrl}
              panoFrames={property.panoFrames}
              satelliteUrl={property.media.satellite ?? null}
              title={property.title}
              lat={property.location.coords.lat}
              lng={property.location.coords.lng}
            />
          </div>

          <PropertyHeader property={property} />

          <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px]">
            {/* Main column */}
            <div className="min-w-0">
              <PropertyFacts property={property} />
              <PropertyAbout
                description={property.description}
                highlights={property.insights.highlights}
              />
              <PropertyAmenities amenities={property.amenities} />
              <PropertyLocation
                lat={property.location.coords.lat}
                lng={property.location.coords.lng}
                locality={property.location.locality}
                city={property.location.city}
                state={property.location.state}
                nearby={property.nearby}
              />
              <PropertyAIInsights insights={property.insights} />

              {/* AI-generated nearby landmarks (OSM Overpass, server-fetched + cached). */}
              <div className="mt-6">
                <PropertyAINearby
                  lat={property.location.coords.lat}
                  lng={property.location.coords.lng}
                />
              </div>

              {/* Free LLM-powered neighbourhood narrative (rules + optional CF Workers AI). */}
              <div className="mt-6">
                <PropertyNeighbourhoodNarrative
                  lat={property.location.coords.lat}
                  lng={property.location.coords.lng}
                  kind={property.kind}
                  bhk={property.bhk}
                  locality={property.location.locality}
                  city={property.location.city}
                  intent={property.intent}
                />
              </div>

              {property.intent !== "rent" && (
                <div className="mt-6">
                  <EMICalculator defaultPriceInr={property.priceInr} />
                </div>
              )}
              <div className="mt-6">
                <PropertyReviews propertyId={property.id} />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
              <PropertyOwnerCard owner={property.owner} propertyTitle={property.title} propertyId={property.id} />
              {property.intent !== "rent" && (
                <MakeOfferModal
                  propertyId={property.id}
                  listingPriceInr={property.priceInr}
                  propertyTitle={property.title}
                />
              )}
              <ScheduleVisitForm propertyId={property.id} ownerName={property.owner.name} />
            </aside>
          </div>
        </Container>

        {similarWithDistance.length > 0 && (
          <div className="mt-14">
            <NearbyRail
              properties={similarWithDistance}
              title="Similar Properties"
              subtitle={`More options near ${property.location.locality}`}
            />
          </div>
        )}
      </main>

      <Footer />
      <MobileStickyCTA property={property} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
