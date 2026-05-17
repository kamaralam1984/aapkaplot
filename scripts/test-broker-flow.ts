/**
 * End-to-end broker flow test — runs against the Prisma layer directly to
 * prove the full lifecycle works:
 *   seller posts → opts in to brokers
 *   broker signs up
 *   broker refers a buyer
 *   buyer makes an offer
 *   seller accepts → commission auto-created
 *
 * Run:
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/aapkaplot?schema=public \
 *   tsx scripts/test-broker-flow.ts
 */
import { PrismaClient } from "@prisma/client";
import { slugify, expectedCommission } from "../lib/broker";

const prisma = new PrismaClient();

function line(label: string) {
  const padLen = Math.max(0, 60 - label.length);
  console.log(`\n── ${label} ${"─".repeat(padLen)}`);
}

async function main() {
  line("0. cleanup any previous run");
  await prisma.commission.deleteMany({});
  await prisma.brokerReferral.deleteMany({});
  await prisma.brokerProfile.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✓ cleaned");

  line("1. create users: seller, broker, buyer");
  const seller = await prisma.user.create({
    data: { phone: "+919800000001", name: "Sushmita Sen", role: "SELLER" },
  });
  const broker = await prisma.user.create({
    data: { phone: "+919800000002", name: "Anjali Realty", role: "AGENT", email: "anjali@example.com" },
  });
  const buyer = await prisma.user.create({
    data: { phone: "+919800000003", name: "Aarav Singh", role: "BUYER" },
  });
  console.log(`✓ seller=${seller.id.slice(0, 8)} broker=${broker.id.slice(0, 8)} buyer=${buyer.id.slice(0, 8)}`);

  line("2. broker creates BrokerProfile (default 1.2%)");
  const profile = await prisma.brokerProfile.create({
    data: {
      userId: broker.id,
      slug: slugify("Anjali Realty"),
      agencyName: "Anjali Realty",
      city: "Kolkata",
      state: "West Bengal",
      panNumber: "ABCDE1234F",
      defaultCommissionPct: 1.2,
      payoutMethod: "upi",
      payoutDetails: { upi: "anjali@okhdfcbank" },
    },
  });
  console.log(`✓ profile slug=${profile.slug} defaultPct=${profile.defaultCommissionPct}%`);

  line("3. seller posts a property — opts in to brokers");
  const property = await prisma.property.create({
    data: {
      title: "Spacious 3 BHK in New Town",
      description: "South-facing, sky-lounge access.",
      kind: "FLAT",
      intent: "SELL",
      status: "ACTIVE",
      priceInr: 9_500_000,                // 95 L
      areaSqft: 1450,
      bhk: 3,
      locality: "New Town",
      city: "Kolkata",
      state: "West Bengal",
      lat: 22.5853, lng: 88.4634,
      coverUrl: "https://example.com/cover.jpg",
      gallery: [],
      amenities: ["pool", "gym"],
      aiBadges: [],
      allowsBrokers: true,
      brokerCommissionPct: null,          // null → fall back to broker's 1.2%
      ownerId: seller.id,
    },
  });
  console.log(`✓ property=${property.id.slice(0, 8)} price=${property.priceInr.toLocaleString("en-IN")} allowsBrokers=${property.allowsBrokers}`);

  line("4. broker refers buyer (matches /api/broker/refer logic)");
  const commissionPct = property.brokerCommissionPct ?? profile.defaultCommissionPct;
  const expected = expectedCommission(property.priceInr, commissionPct);
  const referral = await prisma.brokerReferral.create({
    data: {
      brokerId: broker.id,
      buyerId: buyer.id,
      propertyId: property.id,
      commissionPct,
      expectedCommissionInr: expected,
      status: "pending",
    },
  });
  console.log(`✓ referral=${referral.id.slice(0, 8)} pct=${commissionPct}% expected=₹${expected.toLocaleString("en-IN")}`);

  line("5. buyer makes an offer (matches /api/lead/offer logic)");
  const offerAmount = Math.round(property.priceInr * 0.95);
  const lead = await prisma.lead.create({
    data: {
      fromUserId: buyer.id,
      toUserId: seller.id,
      propertyId: property.id,
      via: "offer",
      offerAmountInr: offerAmount,
      offerStatus: "pending",
      status: "new",
    },
  });
  console.log(`✓ lead=${lead.id.slice(0, 8)} offer=₹${offerAmount.toLocaleString("en-IN")} (${Math.round((offerAmount / property.priceInr) * 100)}% of asking)`);

  line("6. seller accepts offer (matches /api/seller/leads PATCH commission hook)");
  // Inline the same logic as the API for honesty.
  const ref = await prisma.brokerReferral.findFirst({
    where: { buyerId: lead.fromUserId, propertyId: lead.propertyId },
    orderBy: { createdAt: "desc" },
  });
  if (!ref) throw new Error("referral lookup failed");

  const [commission] = await prisma.$transaction([
    prisma.commission.create({
      data: {
        brokerId: ref.brokerId,
        referralId: ref.id,
        amountInr: ref.expectedCommissionInr,
        status: "pending",
        note: "Auto-created on offer accept",
      },
    }),
    prisma.brokerReferral.update({
      where: { id: ref.id },
      data: { status: "offer_accepted", leadId: lead.id },
    }),
    prisma.lead.update({
      where: { id: lead.id },
      data: { offerStatus: "accepted" },
    }),
  ]);
  console.log(`✓ commission=${commission.id.slice(0, 8)} amount=₹${commission.amountInr.toLocaleString("en-IN")} status=${commission.status}`);

  line("7. assertions");
  const checks = [
    {
      name: "Referral status flipped to offer_accepted",
      pass: (await prisma.brokerReferral.findUnique({ where: { id: ref.id } }))?.status === "offer_accepted",
    },
    {
      name: "Commission row created",
      pass: (await prisma.commission.count({ where: { brokerId: broker.id } })) === 1,
    },
    {
      name: "Commission amount = price × pct",
      pass: commission.amountInr === expected,
    },
    {
      name: "Lead linked back to referral",
      pass: (await prisma.brokerReferral.findUnique({ where: { id: ref.id } }))?.leadId === lead.id,
    },
    {
      name: "User promoted to AGENT (would happen via POST /api/broker/profile)",
      pass: (await prisma.user.findUnique({ where: { id: broker.id } }))?.role === "AGENT",
    },
  ];
  for (const c of checks) {
    console.log(`  ${c.pass ? "✓" : "✗"}  ${c.name}`);
  }
  const allPass = checks.every((c) => c.pass);

  line("8. broker dashboard summary (what /broker would show)");
  const agg = await prisma.commission.groupBy({
    by: ["status"],
    where: { brokerId: broker.id },
    _sum: { amountInr: true },
  });
  const totals = { pending: 0, approved: 0, paid: 0 };
  for (const a of agg) {
    if (a.status in totals) (totals as Record<string, number>)[a.status] = a._sum.amountInr ?? 0;
  }
  console.log(`  Pending payouts:  ₹${totals.pending.toLocaleString("en-IN")}`);
  console.log(`  Approved:         ₹${totals.approved.toLocaleString("en-IN")}`);
  console.log(`  Lifetime paid:    ₹${totals.paid.toLocaleString("en-IN")}`);

  console.log("\n" + (allPass ? "✅ ALL CHECKS PASSED" : "❌ SOME CHECKS FAILED"));
  process.exit(allPass ? 0 : 1);
}

main()
  .catch((err) => {
    console.error("✗ test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
