import {
  Amenity,
  AmenityId,
  NearbyKind,
  NearbyPlace,
  PriceTrendPoint,
  PropertyDetail,
  PropertyOwner,
} from "./types";
import { MOCK_PROPERTIES } from "./mock-data";

export const AMENITIES_CATALOG: Record<AmenityId, Amenity> = {
  parking:        { id: "parking", label: "Reserved Parking" },
  "power-backup": { id: "power-backup", label: "Power Backup" },
  "water-supply": { id: "water-supply", label: "24x7 Water" },
  lift:           { id: "lift", label: "Lift" },
  gym:            { id: "gym", label: "Gymnasium" },
  pool:           { id: "pool", label: "Swimming Pool" },
  garden:         { id: "garden", label: "Garden" },
  security:       { id: "security", label: "24x7 Security" },
  cctv:           { id: "cctv", label: "CCTV Surveillance" },
  playground:     { id: "playground", label: "Children's Play Area" },
  clubhouse:      { id: "clubhouse", label: "Club House" },
  wifi:           { id: "wifi", label: "Wi-Fi Ready" },
  ac:             { id: "ac", label: "Air Conditioning" },
  furnished:      { id: "furnished", label: "Furnished" },
  "pet-friendly": { id: "pet-friendly", label: "Pet Friendly" },
};

const NEARBY_BY_KIND: Record<NearbyKind, string[]> = {
  school:     ["DPS New Town", "South Point High", "Vivekananda Public School", "Apeejay School"],
  hospital:   ["Tata Medical Center", "AMRI Hospital", "Apollo Multispecialty", "Fortis Hospital"],
  metro:      ["City Centre Metro", "Karunamoyee Metro", "Salt Lake Sector V", "Bidhannagar Road"],
  market:     ["City Centre Mall", "Eco Park Plaza", "Big Bazaar New Town", "Spencer's Hyper"],
  restaurant: ["Barbeque Nation", "Mainland China", "Oh! Calcutta", "Saffron"],
  bank:       ["HDFC Bank ATM", "SBI Branch", "ICICI Bank", "Axis Bank"],
};

function seededRandom(seed: string): () => number {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function buildNearby(propertyId: string): NearbyPlace[] {
  const rand = seededRandom(propertyId);
  const kinds: NearbyKind[] = ["school", "hospital", "metro", "market", "restaurant", "bank"];
  const out: NearbyPlace[] = [];
  for (const k of kinds) {
    const names = NEARBY_BY_KIND[k];
    const count = 2;
    for (let i = 0; i < count; i++) {
      const name = names[Math.floor(rand() * names.length)];
      out.push({
        id: `${propertyId}-${k}-${i}`,
        kind: k,
        name,
        distanceKm: +(0.3 + rand() * 4.2).toFixed(1),
        rating: +(3.6 + rand() * 1.3).toFixed(1),
      });
    }
  }
  return out.sort((a, b) => a.distanceKm - b.distanceKm);
}

function buildPriceTrend(seed: string, basePricePerSqft: number): PriceTrendPoint[] {
  const rand = seededRandom(seed);
  const months = 12;
  const today = new Date();
  const out: PriceTrendPoint[] = [];
  let value = basePricePerSqft * 0.88;
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    value = value * (1 + (rand() - 0.4) * 0.035);
    out.push({
      monthIso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      pricePerSqft: Math.round(value),
    });
  }
  return out;
}

const MOCK_OWNERS: PropertyOwner[] = [
  {
    id: "u_001",
    name: "Rohan Mehta",
    role: "owner",
    verified: true,
    rating: 4.8,
    listingsCount: 3,
    joinedAt: "2024-04-12T00:00:00Z",
    phoneMasked: "+91 98xxxxxx12",
    responseRateHours: 2,
    avatarUrl: "https://i.pravatar.cc/120?img=12",
  },
  {
    id: "u_002",
    name: "Priya Sharma",
    role: "agent",
    verified: true,
    rating: 4.9,
    listingsCount: 27,
    joinedAt: "2022-09-03T00:00:00Z",
    phoneMasked: "+91 98xxxxxx45",
    responseRateHours: 1,
    avatarUrl: "https://i.pravatar.cc/120?img=47",
  },
  {
    id: "u_003",
    name: "Anik Builders",
    role: "builder",
    verified: true,
    rating: 4.6,
    listingsCount: 12,
    joinedAt: "2021-01-21T00:00:00Z",
    phoneMasked: "+91 98xxxxxx91",
    responseRateHours: 3,
    avatarUrl: "https://i.pravatar.cc/120?img=33",
  },
];

const FALLBACK_GALLERY = [
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=70",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=70",
  "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1600&q=70",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=70",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=70",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=70",
];

const DESCRIPTION_TEMPLATES = [
  (title: string, locality: string) =>
    `Welcome to this beautifully maintained ${title.toLowerCase()} located in the heart of ${locality}. The home features generous natural light, a modern modular kitchen and tasteful interiors throughout. Every corner has been designed for everyday comfort — wide balconies, premium flooring and abundant storage. The neighbourhood offers excellent connectivity to schools, hospitals and shopping centres.`,
  (title: string, locality: string) =>
    `Set in one of the most sought-after addresses in ${locality}, this ${title.toLowerCase()} brings together thoughtful design, premium fittings and unbeatable convenience. Enjoy peaceful surroundings, a vibrant community and quick access to the city's best amenities — all within walking distance.`,
  (title: string, locality: string) =>
    `A rare opportunity in ${locality}. This ${title.toLowerCase()} is move-in ready with quality finishes, secure gated access and ample parking. Perfect for families looking for a balanced lifestyle close to schools, healthcare and entertainment hubs.`,
  (title: string, locality: string) =>
    `Step into this ${title.toLowerCase()} where every detail has been considered. Sun-drenched living spaces flow into a thoughtfully designed kitchen, while bedrooms open onto wide balconies. ${locality} offers a rare mix of green space, modern infrastructure and metro access — making this address one of the smartest picks in the micro-market.`,
  (title: string, locality: string) =>
    `Imagine waking up to peaceful mornings and sunset views from your balcony. This ${title.toLowerCase()} in ${locality} delivers exactly that — premium vitrified flooring, fresh interiors, and a community that feels like home. Walk to top-rated schools, cafés and a metro station that connects to the entire city.`,
  (title: string, locality: string) =>
    `For investors and end-users alike — this ${title.toLowerCase()} in ${locality} is priced sharply below the area average. RERA-approved, owner-managed, and ready for immediate possession. Capital appreciation in this corridor has averaged 14% YoY over the last 3 years.`,
  (title: string, locality: string) =>
    `Spacious. Sunlit. Smart. This ${title.toLowerCase()} reimagines urban living in ${locality}. The layout has been optimised for cross ventilation and privacy, with separate utility and dry areas. Includes covered parking, 24×7 security, and access to a clubhouse with a pool and gym.`,
  (title: string, locality: string) =>
    `Hand-finished interiors, smart-home wiring, and a neighbourhood that's quietly becoming one of ${locality}'s most coveted addresses. This ${title.toLowerCase()} is the calm-in-the-city you've been searching for — high ceilings, energy-efficient fittings, and an owner ready to close fast.`,
];

const DEFAULT_AMENITY_SETS: Record<string, AmenityId[]> = {
  flat:        ["parking", "power-backup", "water-supply", "lift", "gym", "security", "cctv", "clubhouse"],
  house:       ["parking", "garden", "water-supply", "security", "cctv", "power-backup"],
  villa:       ["parking", "pool", "garden", "gym", "clubhouse", "security", "cctv", "power-backup"],
  plot:        ["security"],
  agriculture: ["water-supply"],
  shop:        ["parking", "power-backup", "security", "cctv"],
  office:      ["parking", "lift", "power-backup", "security", "cctv", "ac", "wifi"],
  warehouse:   ["parking", "power-backup", "security", "cctv"],
};

const HIGHLIGHTS_POOL = [
  "Premium connectivity to metro & highway",
  "Walking distance to top-rated schools",
  "High rental yield in this micro-market",
  "Below-market price for this configuration",
  "Recent infrastructure development nearby",
  "Verified owner with documented title",
  "Low maintenance & gated community",
  "Demand has grown 18% YoY in this locality",
  "Price may increase soon — new metro line confirmed",
  "Hot listing — viewed 1,200+ times this week",
  "Rare configuration with corner-unit privacy",
  "RERA registered with clean approvals",
  "Quiet street, walkable to cafés & green space",
  "AI estimate: rents in this locality rising 9% YoY",
];

/** Build a deterministic enriched detail view for any mock property id. */
export function getPropertyDetail(id: string): PropertyDetail | null {
  const base = MOCK_PROPERTIES.find((p) => p.id === id);
  if (!base) return null;

  const rand = seededRandom(id);
  const ownerIndex = Math.floor(rand() * MOCK_OWNERS.length);
  const tmplIndex = Math.floor(rand() * DESCRIPTION_TEMPLATES.length);

  const amenities = DEFAULT_AMENITY_SETS[base.kind] ?? ["parking", "security"];
  const pricePerSqft = Math.round(base.priceInr / Math.max(1, base.areaSqft));
  const areaPricePerSqft = Math.round(pricePerSqft * (0.92 + rand() * 0.18));
  const trend = buildPriceTrend(id, pricePerSqft);
  const investmentScore = Math.min(
    98,
    Math.round(base.trustScore * 0.6 + (trend[trend.length - 1].pricePerSqft / trend[0].pricePerSqft) * 35)
  );

  const highlights = [...HIGHLIGHTS_POOL]
    .sort(() => rand() - 0.5)
    .slice(0, 4);

  const features = {
    bedrooms: base.bhk,
    bathrooms: base.bhk ? Math.min(base.bhk, 3) : undefined,
    balconies: base.bhk ? Math.max(1, base.bhk - 1) : undefined,
    parking: base.kind === "plot" || base.kind === "agriculture" ? undefined : 1 + Math.floor(rand() * 2),
    floor: ["flat", "office"].includes(base.kind) ? `${1 + Math.floor(rand() * 10)} of ${10 + Math.floor(rand() * 8)}` : undefined,
    facing: ["East", "West", "North", "North-East", "South-East"][Math.floor(rand() * 5)],
    furnishing: (["Unfurnished", "Semi-furnished", "Furnished"] as const)[Math.floor(rand() * 3)],
    ageYears: base.kind === "plot" ? undefined : Math.floor(rand() * 8),
    transactionType: (["New booking", "Resale"] as const)[Math.floor(rand() * 2)],
    availableFrom: new Date(Date.now() + Math.floor(rand() * 60) * 86_400_000).toISOString(),
  };

  return {
    ...base,
    description: DESCRIPTION_TEMPLATES[tmplIndex](base.title, base.location.locality),
    amenities,
    features,
    media: {
      ...base.media,
      gallery: base.media.gallery && base.media.gallery.length > 0
        ? base.media.gallery
        : [base.media.cover, ...FALLBACK_GALLERY].slice(0, 6),
    },
    floorPlanUrl: "https://images.unsplash.com/photo-1574958269340-fa927503f3dd?auto=format&fit=crop&w=1200&q=70",
    videoUrl: undefined,
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    panoFrames: undefined,
    owner: MOCK_OWNERS[ownerIndex],
    nearby: buildNearby(id),
    insights: {
      trustScore: base.trustScore,
      investmentScore,
      priceVsArea:
        pricePerSqft < areaPricePerSqft * 0.97
          ? "below"
          : pricePerSqft > areaPricePerSqft * 1.03
          ? "above"
          : "fair",
      pricePerSqft,
      areaPricePerSqft,
      monthlyTrend: trend,
      highlights,
    },
  };
}

/** All ids — used by generateStaticParams. */
export function getAllPropertyIds(): string[] {
  return MOCK_PROPERTIES.map((p) => p.id);
}

/** Cheap "similar properties" — same city, exclude self. */
export function getSimilarProperties(id: string, limit = 8) {
  const self = MOCK_PROPERTIES.find((p) => p.id === id);
  if (!self) return [];
  return MOCK_PROPERTIES.filter(
    (p) => p.id !== id && (p.kind === self.kind || p.location.city === self.location.city)
  ).slice(0, limit);
}
