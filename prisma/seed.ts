/**
 * Seed script — populates the DB with the same 120-listing catalogue used
 * everywhere else, plus a few demo users and leads.
 *
 *   npm run db:seed
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { MOCK_PROPERTIES } from "../lib/mock-data";
import { MOCK_LEADS, MOCK_USERS, MOCK_VISITS } from "../lib/mock-dashboard";

const prisma = new PrismaClient();

const PROPERTY_KIND_MAP: Record<string, Prisma.PropertyCreateInput["kind"]> = {
  plot:        "PLOT",
  flat:        "FLAT",
  house:       "HOUSE",
  villa:       "VILLA",
  shop:        "SHOP",
  office:      "OFFICE",
  warehouse:   "WAREHOUSE",
  agriculture: "AGRICULTURE",
};

const INTENT_MAP: Record<string, Prisma.PropertyCreateInput["intent"]> = {
  buy:  "BUY",
  rent: "RENT",
  sell: "SELL",
};

async function ensureUsers() {
  for (const u of MOCK_USERS) {
    await prisma.user.upsert({
      where: { phone: u.phone.replace(/\s/g, "") },
      update: {
        name: u.name,
        email: u.email ?? undefined,
        role: u.role.toUpperCase() as Prisma.UserCreateInput["role"],
        phoneVerified: u.verified ? new Date() : null,
      },
      create: {
        id: u.id,
        phone: u.phone.replace(/\s/g, ""),
        email: u.email ?? null,
        name: u.name,
        role: u.role.toUpperCase() as Prisma.UserCreateInput["role"],
        phoneVerified: u.verified ? new Date() : null,
      },
    });
  }
}

async function seedProperties(ownerId: string) {
  for (const p of MOCK_PROPERTIES) {
    await prisma.property.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        title: p.title,
        kind: PROPERTY_KIND_MAP[p.kind] ?? "FLAT",
        intent: INTENT_MAP[p.intent] ?? "BUY",
        status: "ACTIVE",
        priceInr: p.priceInr,
        previousPriceInr: p.previousPriceInr ?? null,
        areaSqft: p.areaSqft,
        bhk: p.bhk ?? null,
        locality: p.location.locality,
        city: p.location.city,
        state: p.location.state,
        lat: p.location.coords.lat,
        lng: p.location.coords.lng,
        coverUrl: p.media.cover,
        gallery: p.media.gallery ?? [],
        verified: p.verified,
        trustScore: p.trustScore,
        amenities: (p.amenities ?? []) as string[],
        aiBadges: (p.badges ?? []) as string[],
        ownerId,
      },
    });
  }

  // Populate the PostGIS geography column from the lat/lng we just wrote.
  await prisma.$executeRaw`
    UPDATE "Property"
    SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    WHERE geom IS NULL OR true;
  `;

  // Best-effort spatial index — ignore if it already exists.
  try {
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS property_geom_idx ON "Property" USING GIST (geom);`;
  } catch (err) {
    console.warn("[seed] could not create GIST index:", (err as Error).message);
  }
}

async function seedLeads() {
  for (const l of MOCK_LEADS) {
    const buyer = await prisma.user.findFirst({ where: { name: l.buyerName } });
    const property = await prisma.property.findUnique({ where: { id: l.propertyId } });
    if (!property || !buyer) continue;
    await prisma.lead.create({
      data: {
        fromUserId: buyer.id,
        toUserId: property.ownerId,
        propertyId: property.id,
        message: l.message,
        via: l.channel,
      },
    });
  }
}

async function seedVisits() {
  for (const v of MOCK_VISITS) {
    // Visits are stored on the application side for now; nothing to write
    // to the DB until a `Visit` model is added. Skipping safely.
    void v;
  }
}

async function main() {
  console.log("[seed] users…");
  await ensureUsers();

  const owner = await prisma.user.findFirst({ where: { role: "SELLER" } });
  if (!owner) throw new Error("No seller user found — check MOCK_USERS");

  console.log(`[seed] properties (owner=${owner.id})…`);
  await seedProperties(owner.id);

  console.log("[seed] leads…");
  await seedLeads();

  console.log("[seed] visits…");
  await seedVisits();

  const propCount = await prisma.property.count();
  const userCount = await prisma.user.count();
  console.log(`[seed] ✓ ${propCount} properties, ${userCount} users ready.`);
}

main()
  .catch((e) => {
    console.error("[seed] failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
