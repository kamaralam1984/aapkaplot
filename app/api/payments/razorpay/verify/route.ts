import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { BuilderPlanTier, SubStatus } from "@prisma/client";

const PLAN_AMOUNTS: Record<string, number> = {
  STARTER:      299900,
  GROWTH:       999900,
  DOMINATOR:   4999900,
  LEAD_REVEAL:    4900,
  BOOST_7:      29900,
  BOOST_30:     99900,
  VALUATION:    19900,
};

const PLAN_LIMITS: Record<string, number> = {
  STARTER: 5,
  GROWTH: 50,
  DOMINATOR: -1,
};

const SUBSCRIPTION_PLANS = new Set(["STARTER", "GROWTH", "DOMINATOR"]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "payment_not_configured" }, { status: 503 });
  }

  const json = await req.json().catch(() => ({}));
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan, propertyId } =
    json as {
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
      plan?: string;
      propertyId?: string;
    };

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !plan || !PLAN_AMOUNTS[plan]) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // Verify HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const amountPaise = PLAN_AMOUNTS[plan];

  // ── LEAD_REVEAL ────────────────────────────────────────────────────────────
  if (plan === "LEAD_REVEAL") {
    if (!propertyId) {
      return NextResponse.json({ error: "property_id_required" }, { status: 400 });
    }
    if (process.env.USE_DB === "1") {
      try {
        const property = await prisma.property.findUnique({
          where: { id: propertyId },
          select: { owner: { select: { name: true, phone: true } } },
        });
        const phone = property?.owner?.phone ?? null;
        await prisma.microPayment.create({
          data: {
            userId: session.uid,
            type: "LEAD_REVEAL",
            propertyId,
            razorpayOrderId,
            razorpayPaymentId,
            amountPaise,
            status: "paid",
          },
        }).catch(() => null);
        return NextResponse.json({ ok: true, type: "LEAD_REVEAL", phone });
      } catch {
        return NextResponse.json({ ok: true, type: "LEAD_REVEAL", phone: null });
      }
    }
    return NextResponse.json({ ok: true, type: "LEAD_REVEAL", phone: null });
  }

  // ── BOOST (featured listing) ───────────────────────────────────────────────
  if (plan === "BOOST_7" || plan === "BOOST_30") {
    const days = plan === "BOOST_7" ? 7 : 30;
    if (process.env.USE_DB === "1" && propertyId) {
      const boostUntil = new Date(Date.now() + days * 86400_000);
      await prisma.property.update({
        where: { id: propertyId },
        data: { boostedUntil: boostUntil, promotionTag: "featured" },
      }).catch(() => null);
      await prisma.microPayment.create({
        data: {
          userId: session.uid,
          type: plan,
          propertyId,
          razorpayOrderId,
          razorpayPaymentId,
          amountPaise,
          status: "paid",
        },
      }).catch(() => null);
    }
    return NextResponse.json({ ok: true, type: plan, days });
  }

  // ── VALUATION PDF ──────────────────────────────────────────────────────────
  if (plan === "VALUATION") {
    if (process.env.USE_DB === "1") {
      await prisma.microPayment.create({
        data: {
          userId: session.uid,
          type: "VALUATION",
          propertyId: propertyId ?? null,
          razorpayOrderId,
          razorpayPaymentId,
          amountPaise,
          status: "paid",
        },
      }).catch(() => null);
    }
    return NextResponse.json({ ok: true, type: "VALUATION" });
  }

  // ── SUBSCRIPTION PLANS ─────────────────────────────────────────────────────
  if (!SUBSCRIPTION_PLANS.has(plan)) {
    return NextResponse.json({ error: "unknown_plan" }, { status: 400 });
  }

  const listingLimit = PLAN_LIMITS[plan];
  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const tier = plan as BuilderPlanTier;

  const subscription = await prisma.builderSubscription.upsert({
    where: { userId: session.uid },
    create: { userId: session.uid, tier, status: SubStatus.ACTIVE, currentPeriodEnd, listingLimit, amountPaise },
    update: { tier, status: SubStatus.ACTIVE, currentPeriodEnd, listingLimit, amountPaise },
  });

  await prisma.builderPayment.create({
    data: { subscriptionId: subscription.id, razorpayOrderId, razorpayPaymentId, razorpaySignature, amountPaise, status: "paid", plan },
  });

  return NextResponse.json({ ok: true, type: "SUBSCRIPTION", subscriptionId: subscription.id });
}
