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
import { HomeLoanBanner } from "@/components/property/HomeLoanBanner";
import { ValuationReportButton } from "@/components/property/ValuationReportButton";
import { PriceAlertButton } from "@/components/property/PriceAlertButton";

import {
  getAllPropertyIds,
  getPropertyDetail,
  getSimilarProperties,
} from "@/lib/property-detail";
import { loadPropertyDetailFromDb, getPropertyNearbyCustom } from "@/lib/property-detail-db";
import { getSession } from "@/lib/auth-server";
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

// Always server-render so session-based UI (edit buttons, owner controls)
// reflects the actual logged-in user on every request.
export const dynamic = "force-dynamic";

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
  const [property, session] = await Promise.all([resolveProperty(id), getSession()]);
  const nearbyCustom = property ? await getPropertyNearbyCustom(id) : [];
  if (!property) notFound();

  // Sellers should not see "Make an offer" / phone-reveal on their own
  // listing — that's the source of the cannot_offer_own surprise.
  const isOwner = Boolean(session && session.uid === property.owner.id);
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  const isAdmin = Boolean(session && (
    session.role === "admin" || session.role === "super_admin" ||
    (session.email && superAdminEmails.includes(session.email.toLowerCase()))
  ));
  const canEditNearby = isOwner || isAdmin;
  console.log("[canEdit]", { email: session?.email, role: session?.role, uid: session?.uid, ownerUid: property.owner.id, isOwner, isAdmin, canEditNearby, superAdminEmails });

  const similar = getSimilarProperties(property.id, 8);
  const similarWithDistance = withinRadius(property.location.coords, similar, 200);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: property.location.city, href: `/city/${property.location.city.toLowerCase()}` },
    { label: property.location.locality, href: `/locality/${property.location.locality.toLowerCase().replace(/\s+/g, "-")}` },
    { label: property.title },
  ];

  // Schema bundle: RealEstateListing (Google's preferred type for property
  // listings — richer than Residence) + BreadcrumbList. @graph wraps both
  // in a single JSON-LD block so Google can pick out either entity.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";
  const propertyUrl = `${siteUrl}/property/${property.id}`;
  const galleryUrls = property.media.gallery?.length
    ? property.media.gallery
    : property.media.cover
      ? [property.media.cover]
      : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["RealEstateListing", "Residence"],
        "@id": propertyUrl,
        url: propertyUrl,
        name: property.title,
        description: property.description,
        image: galleryUrls,
        datePosted: property.postedAt,
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
          unitText: "Square Feet",
        },
        numberOfRooms: property.features.bedrooms,
        offers: {
          "@type": "Offer",
          price: property.priceInr,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: propertyUrl,
          priceValidUntil: new Date(Date.now() + 90 * 86400 * 1000).toISOString().slice(0, 10),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.label,
          item: b.href ? `${siteUrl}${b.href}` : propertyUrl,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `${property.title} ki price kya hai?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${property.title} ki price ${formatInr(property.priceInr)} hai — ${property.location.locality}, ${property.location.city} mein located hai. Area: ${property.areaSqft} sqft.`,
            },
          },
          {
            "@type": "Question",
            name: `${property.location.locality} mein property kaise buy karein?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${property.location.locality}, ${property.location.city} mein property khareedne ke liye AapKaPlot pe verified listings dekhein. Owner se seedha contact karein, site visit schedule karein aur secure payment karein.`,
            },
          },
          {
            "@type": "Question",
            name: `Kya yeh property RERA registered hai?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `AapKaPlot pe listed sab properties verified owners dwara post ki jati hain. RERA registration ke baare mein seedha owner se puchein ya ${property.location.state} RERA portal check karein.`,
            },
          },
          ...(property.intent !== "rent" ? [{
            "@type": "Question",
            name: `${property.title} pe home loan milega?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Haan, ${formatInr(Math.round(property.priceInr * 0.8))} tak home loan mil sakta hai (80% LTV). SBI, HDFC aur ICICI Bank ${property.location.city} mein home loans dete hain 8.4% se shuru.`,
            },
          }] : []),
        ],
      },
    ],
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
                  propertyId={property.id}
                  nearbyCustom={nearbyCustom}
                  canEdit={canEditNearby}
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
              {isOwner ? (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
                  <p className="text-[13px] font-bold text-violet-900">This is your listing</p>
                  <p className="mt-1 text-[12px] text-violet-700">
                    Buyers will see your phone / WhatsApp here. Edit details from{" "}
                    <a href={`/sell/edit/${property.id}`} className="font-semibold underline">
                      /sell/edit
                    </a>{" "}
                    or update your contact info in{" "}
                    <a href="/me/settings" className="font-semibold underline">
                      Settings
                    </a>.
                  </p>
                </div>
              ) : (
                <PropertyOwnerCard owner={property.owner} propertyTitle={property.title} propertyId={property.id} />
              )}
              {!isOwner && property.intent !== "rent" && (
                <MakeOfferModal
                  propertyId={property.id}
                  listingPriceInr={property.priceInr}
                  propertyTitle={property.title}
                />
              )}
              <ScheduleVisitForm propertyId={property.id} ownerName={property.owner.name} />
              <PriceAlertButton propertyId={property.id} priceInr={property.priceInr} />
              {property.intent !== "rent" && (
                <HomeLoanBanner priceInr={property.priceInr} />
              )}
              <ValuationReportButton
                propertyId={property.id}
                priceInr={property.priceInr}
                locality={property.location.locality}
                city={property.location.city}
              />
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
