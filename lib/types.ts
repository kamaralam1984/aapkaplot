export type PropertyKind =
  | "plot"
  | "flat"
  | "house"
  | "villa"
  | "shop"
  | "office"
  | "warehouse"
  | "agriculture";

export type ListingIntent = "buy" | "rent" | "sell";

export type AIBadge =
  | "near-you"
  | "best-investment"
  | "high-demand"
  | "price-dropped"
  | "near-metro"
  | "trending";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface PropertyMedia {
  cover: string;
  gallery?: string[];
  video?: string;
  satellite?: string;
}

export interface Property {
  id: string;
  title: string;
  kind: PropertyKind;
  intent: ListingIntent;
  priceInr: number;
  /** previous price (for "price dropped" callouts) */
  previousPriceInr?: number;
  areaSqft: number;
  bhk?: number;
  location: {
    locality: string;
    city: string;
    state: string;
    coords: GeoPoint;
  };
  media: PropertyMedia;
  verified: boolean;
  trustScore: number; // 0..100
  postedAt: string; // ISO date
  badges?: AIBadge[];
  /** Admin-set promotion tag (overrides auto viral badge when present). */
  promotionTag?: string;
  /** Concrete amenity slugs (parking / pool / lift …) so filters can narrow. */
  amenities?: AmenityId[];
  /** Furnishing level (used by §6 furnishing filter). */
  furnishing?: "unfurnished" | "semi" | "full";
  /** Reserved parking present (used by §6 parking filter). */
  hasParking?: boolean;
  /** Nearest POI distances in km, used by §6 nearby filter. */
  nearbyKm?: Partial<Record<"school" | "metro" | "hospital" | "market", number>>;
  /** Pre-computed distance from a reference point in km (filled at runtime). */
  distanceKm?: number;
}

export interface SearchFilters {
  intent: ListingIntent | "all";
  kind?: PropertyKind | "all";
  budgetMin?: number;
  budgetMax?: number;
  bhk?: number;
  radiusKm?: number;
  origin?: GeoPoint;
  query?: string;
}

export interface AICategory {
  id: AIBadge;
  label: string;
  tone: "emerald" | "sky" | "amber" | "rose" | "violet";
}

export type AmenityId =
  | "parking"
  | "power-backup"
  | "water-supply"
  | "lift"
  | "gym"
  | "pool"
  | "garden"
  | "security"
  | "cctv"
  | "playground"
  | "clubhouse"
  | "wifi"
  | "ac"
  | "furnished"
  | "pet-friendly";

export interface Amenity {
  id: AmenityId;
  label: string;
}

export type NearbyKind =
  | "school"
  | "hospital"
  | "metro"
  | "market"
  | "restaurant"
  | "bank";

export interface NearbyPlace {
  id: string;
  kind: NearbyKind;
  name: string;
  distanceKm: number;
  rating?: number;
}

export interface PropertyOwner {
  id: string;
  name: string;
  avatarUrl?: string;
  role: "owner" | "agent" | "builder";
  verified: boolean;
  rating?: number;
  listingsCount?: number;
  joinedAt: string; // ISO
  phoneMasked?: string;
  responseRateHours?: number;
}

export interface PriceTrendPoint {
  monthIso: string; // YYYY-MM
  pricePerSqft: number;
}

export interface AIInsights {
  trustScore: number; // 0..100
  investmentScore: number; // 0..100
  priceVsArea: "below" | "fair" | "above";
  pricePerSqft: number;
  areaPricePerSqft: number;
  monthlyTrend: PriceTrendPoint[];
  highlights: string[];
}

export interface PropertyDetail extends Property {
  description: string;
  amenities: AmenityId[];
  features: {
    bedrooms?: number;
    bathrooms?: number;
    balconies?: number;
    parking?: number;
    floor?: string;        // e.g. "4 of 12"
    facing?: string;       // e.g. "East"
    furnishing?: "Unfurnished" | "Semi-furnished" | "Furnished";
    ageYears?: number;
    transactionType?: "New booking" | "Resale";
    availableFrom?: string; // ISO date
  };
  floorPlanUrl?: string;
  videoUrl?: string;
  /** YouTube walkthrough URL or 11-char video id. */
  youtubeUrl?: string;
  /** Sequence of frames for the 360° viewer (12–72 frames typical). */
  panoFrames?: string[];
  owner: PropertyOwner;
  nearby: NearbyPlace[];
  insights: AIInsights;
}
