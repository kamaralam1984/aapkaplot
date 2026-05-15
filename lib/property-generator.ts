/**
 * Deterministic property generator — no network, no `faker` dep, no Math.random.
 * Generates 100+ realistic-looking properties seeded from a stable PRNG so that
 * Sitemap / SSR / filters return the same data across renders.
 */

import type { AmenityId, Property, PropertyKind } from "./types";

interface SubArea {
  locality: string;
  lat: number;
  lng: number;
}

interface CityBlock {
  city: string;
  state: string;
  /** Approx. base price per sqft in INR. */
  baseRate: number;
  areas: SubArea[];
}

const CITIES: CityBlock[] = [
  {
    city: "Kolkata",
    state: "West Bengal",
    baseRate: 5500,
    areas: [
      { locality: "Sodepur",   lat: 22.6968, lng: 88.3873 },
      { locality: "New Town",  lat: 22.5786, lng: 88.4636 },
      { locality: "Rajarhat",  lat: 22.6086, lng: 88.4515 },
      { locality: "Salt Lake", lat: 22.5697, lng: 88.4202 },
      { locality: "Garia",     lat: 22.4624, lng: 88.3982 },
      { locality: "Belgachia", lat: 22.6033, lng: 88.3795 },
      { locality: "Khardaha",  lat: 22.7194, lng: 88.3792 },
      { locality: "Uttarpara", lat: 22.6705, lng: 88.3489 },
    ],
  },
  {
    city: "Bengaluru",
    state: "Karnataka",
    baseRate: 8200,
    areas: [
      { locality: "Whitefield",   lat: 12.9698, lng: 77.7500 },
      { locality: "Indiranagar",  lat: 12.9716, lng: 77.6412 },
      { locality: "Koramangala",  lat: 12.9352, lng: 77.6245 },
      { locality: "HSR Layout",   lat: 12.9082, lng: 77.6476 },
      { locality: "Electronic City", lat: 12.8452, lng: 77.6602 },
      { locality: "Hebbal",       lat: 13.0356, lng: 77.5970 },
    ],
  },
  {
    city: "Mumbai",
    state: "Maharashtra",
    baseRate: 18500,
    areas: [
      { locality: "Andheri West", lat: 19.1364, lng: 72.8296 },
      { locality: "Bandra West",  lat: 19.0596, lng: 72.8295 },
      { locality: "Powai",        lat: 19.1176, lng: 72.9060 },
      { locality: "Goregaon East", lat: 19.1646, lng: 72.8493 },
      { locality: "Thane West",   lat: 19.2183, lng: 72.9781 },
      { locality: "Lower Parel",  lat: 18.9929, lng: 72.8295 },
    ],
  },
  {
    city: "Pune",
    state: "Maharashtra",
    baseRate: 7400,
    areas: [
      { locality: "Hinjewadi",     lat: 18.5912, lng: 73.7389 },
      { locality: "Baner",         lat: 18.5590, lng: 73.7868 },
      { locality: "Kothrud",       lat: 18.5074, lng: 73.8077 },
      { locality: "Wakad",         lat: 18.5975, lng: 73.7635 },
      { locality: "Viman Nagar",   lat: 18.5679, lng: 73.9143 },
    ],
  },
  {
    city: "Delhi NCR",
    state: "Delhi",
    baseRate: 9800,
    areas: [
      { locality: "Dwarka",        lat: 28.5921, lng: 77.0460 },
      { locality: "Saket",         lat: 28.5244, lng: 77.2066 },
      { locality: "Greater Noida", lat: 28.4744, lng: 77.5040 },
      { locality: "Gurugram Sector 56", lat: 28.4254, lng: 77.0964 },
      { locality: "Noida Sector 62", lat: 28.6273, lng: 77.3711 },
    ],
  },
];

const KINDS: { kind: PropertyKind; weight: number }[] = [
  { kind: "flat",        weight: 5 },
  { kind: "house",       weight: 2 },
  { kind: "plot",        weight: 2 },
  { kind: "villa",       weight: 1 },
  { kind: "shop",        weight: 1 },
  { kind: "office",      weight: 1 },
  { kind: "warehouse",   weight: 1 },
  { kind: "agriculture", weight: 1 },
];

const TITLE_TEMPLATES: Record<PropertyKind, (bhk?: number) => string> = {
  flat:        (b) => `${b ?? 2}BHK Flat`,
  house:       (b) => `${b ?? 3}BHK Independent House`,
  villa:       (b) => `${b ?? 4}BHK Luxury Villa`,
  plot:        () => "Residential Plot",
  shop:        () => "Shop for Sale",
  office:      () => "Office Space",
  warehouse:   () => "Warehouse Unit",
  agriculture: () => "Agricultural Land",
};

const IMG_BANK = {
  flat: [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=70",
  ],
  house: [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=70",
  ],
  villa: [
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=70",
  ],
  plot: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=70",
  ],
  shop: ["https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=70"],
  office: ["https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=70"],
  warehouse: ["https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=70"],
  agriculture: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=70"],
} as const;

const AMENITY_POOL: AmenityId[] = [
  "parking", "power-backup", "water-supply", "lift", "gym", "pool", "garden",
  "security", "cctv", "playground", "clubhouse", "wifi", "ac", "furnished",
  "pet-friendly",
];

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pickWeighted<T>(rand: () => number, items: { weight: number }[] & ({ kind: T }[] | { id: T }[])): T {
  const total = items.reduce((s, x: any) => s + x.weight, 0);
  let n = rand() * total;
  for (const item of items as any[]) {
    n -= item.weight;
    if (n <= 0) return (item.kind ?? item.id) as T;
  }
  return ((items[items.length - 1] as any).kind ?? (items[items.length - 1] as any).id) as T;
}

function jitter(base: number, range: number, rand: () => number) {
  return base + (rand() - 0.5) * range;
}

/**
 * Generate `count` deterministic properties starting at id offset `start`.
 * Combined with a hand-curated list of 10 hero properties for the homepage,
 * this gives ~120 entries to drive search and dashboards.
 */
export function generateMockProperties(count: number, start = 11): Property[] {
  const out: Property[] = [];
  for (let i = 0; i < count; i++) {
    const rand = lcg(0xa5a5 + i);
    const city = CITIES[Math.floor(rand() * CITIES.length)];
    const area = city.areas[Math.floor(rand() * city.areas.length)];
    const kind = pickWeighted<PropertyKind>(rand, KINDS);

    const isResidential = kind === "flat" || kind === "house" || kind === "villa";
    const bhk = isResidential ? 1 + Math.floor(rand() * 4) : undefined;
    const areaSqft = kind === "plot" || kind === "agriculture"
      ? 800 + Math.floor(rand() * 4200)
      : kind === "warehouse"
      ? 1500 + Math.floor(rand() * 6500)
      : kind === "office" || kind === "shop"
      ? 350 + Math.floor(rand() * 2200)
      : 450 + Math.floor(rand() * 1450);

    const pricePerSqft = city.baseRate * jitter(1, 0.4, rand);
    const priceInr = Math.round((areaSqft * pricePerSqft) / 1000) * 1000;
    const droppedRecently = rand() < 0.18;
    const previousPriceInr = droppedRecently
      ? Math.round(priceInr * (1 + 0.05 + rand() * 0.12))
      : undefined;

    const intent = rand() < 0.85 ? "buy" : "rent";

    // Amenity selection — pick a kind-aware subset
    const baseSet: AmenityId[] =
      kind === "plot" || kind === "agriculture"
        ? ["security"]
        : kind === "shop" || kind === "warehouse"
        ? ["parking", "power-backup", "security", "cctv"]
        : kind === "office"
        ? ["parking", "lift", "power-backup", "security", "cctv", "ac", "wifi"]
        : ["parking", "power-backup", "water-supply", "security", "cctv"];

    const extra = AMENITY_POOL
      .filter((a) => !baseSet.includes(a))
      .sort(() => rand() - 0.5)
      .slice(0, 1 + Math.floor(rand() * 4));
    const amenities = [...baseSet, ...extra];

    const hasParking = amenities.includes("parking");
    const furnishing: "unfurnished" | "semi" | "full" = isResidential
      ? (["unfurnished", "semi", "full"] as const)[Math.floor(rand() * 3)]
      : "unfurnished";

    const nearbyKm = {
      school:   +(0.3 + rand() * 4).toFixed(1),
      metro:    +(0.4 + rand() * 6).toFixed(1),
      hospital: +(0.5 + rand() * 5).toFixed(1),
      market:   +(0.2 + rand() * 3).toFixed(1),
    };

    const bank = IMG_BANK[kind] ?? IMG_BANK.flat;
    const cover = bank[Math.floor(rand() * bank.length)];

    const verified = rand() < 0.78;
    const trustScore = 65 + Math.floor(rand() * 33);
    const postedAt = new Date(Date.now() - Math.floor(rand() * 60) * 86_400_000).toISOString();

    out.push({
      id: `p_${String(start + i).padStart(3, "0")}`,
      title: TITLE_TEMPLATES[kind](bhk),
      kind,
      intent,
      priceInr,
      previousPriceInr,
      areaSqft,
      bhk,
      location: {
        locality: area.locality,
        city: city.city,
        state: city.state,
        coords: {
          lat: jitter(area.lat, 0.02, rand),
          lng: jitter(area.lng, 0.02, rand),
        },
      },
      media: { cover },
      verified,
      trustScore,
      postedAt,
      amenities,
      furnishing,
      hasParking,
      nearbyKm,
    });
  }
  return out;
}
