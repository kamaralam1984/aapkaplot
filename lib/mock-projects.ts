/**
 * Seed projects shown until the DB-backed list lands or until a seller
 * actually creates one via /sell. Keeps the city → projects pages alive in
 * dev and provides realistic SSR for SEO.
 */
export interface MockProject {
  id: string;
  slug: string;
  name: string;
  builder: string;
  description: string;
  city: string;
  locality: string;
  state: string;
  lat: number;
  lng: number;
  status: "ongoing" | "upcoming" | "completed";
  startDate?: string;
  possessionDate?: string;
  totalUnits?: number;
  reraId?: string;
  amenities: string[];
  coverUrl: string;
  gallery: string[];
}

const IMG = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=70";
const IMG2 = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=70";
const IMG3 = "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=70";

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: "prj_001",
    slug: "newtown-emerald-heights",
    name: "Emerald Heights",
    builder: "Sun & Sand Developers",
    description:
      "Premium 2 & 3 BHK towers in New Town with a 12-acre central park, sky-lounge and a 200m jogging loop.",
    city: "Kolkata",
    locality: "New Town",
    state: "West Bengal",
    lat: 22.5853, lng: 88.4634,
    status: "ongoing",
    startDate: "2024-01-10",
    possessionDate: "2027-06-30",
    totalUnits: 480,
    reraId: "WBRERA/PRJ/000123",
    amenities: ["Clubhouse", "Pool", "Gym", "Kids' play", "EV charging", "24×7 security"],
    coverUrl: IMG,
    gallery: [IMG, IMG2, IMG3],
  },
  {
    id: "prj_002",
    slug: "whitefield-aqua-residences",
    name: "Aqua Residences",
    builder: "Prestige Group",
    description:
      "Resort-style living in Whitefield — 1, 2 & 3 BHK with infinity pool, indoor games and walking distance to ITPL.",
    city: "Bengaluru",
    locality: "Whitefield",
    state: "Karnataka",
    lat: 12.9698, lng: 77.7500,
    status: "upcoming",
    possessionDate: "2028-03-15",
    totalUnits: 320,
    reraId: "PRM/KA/RERA/1251/00045",
    amenities: ["Infinity pool", "Tennis", "Yoga deck", "Co-working", "Pet park"],
    coverUrl: IMG2,
    gallery: [IMG2, IMG3, IMG],
  },
  {
    id: "prj_003",
    slug: "andheri-skyline-towers",
    name: "Skyline Towers",
    builder: "Lodha",
    description:
      "Iconic 35-storey towers in Andheri (W) — sea-view homes, sky-deck and rapid metro access.",
    city: "Mumbai",
    locality: "Andheri",
    state: "Maharashtra",
    lat: 19.1197, lng: 72.8468,
    status: "ongoing",
    startDate: "2023-05-12",
    possessionDate: "2026-12-30",
    totalUnits: 220,
    reraId: "P51800012345",
    amenities: ["Sea view", "Sky-deck", "Pool", "Concierge", "Smart-home"],
    coverUrl: IMG3,
    gallery: [IMG3, IMG, IMG2],
  },
];

export function listProjectsByCity(city: string): MockProject[] {
  const k = city.toLowerCase();
  return MOCK_PROJECTS.filter((p) => p.city.toLowerCase() === k);
}

export function findProjectBySlug(slug: string): MockProject | undefined {
  return MOCK_PROJECTS.find((p) => p.slug === slug);
}
