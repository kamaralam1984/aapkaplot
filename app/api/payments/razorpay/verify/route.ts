import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { BuilderPlanTier, SubStatus } from "@prisma/client";

const PLAN_AMOUNTS: Record<string, number> = {
  STARTER: 299900,
  GROWTH: 999900,
  DOMINATOR: 4999900,
};

const PLAN_LIMITS: Record<string, number> = {
  STARTER: 5,
  GROWTH: 50,
  DOMINATOR: -1,
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json(
      { error: "payment_not_configured" },
      { status: 503 }
    );
  }

  const json = await req.json().catch(() => ({}));
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan } =
    json as {
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
      plan?: string;
    };

  if (
    !razorpayOrderId ||
    !razorpayPaymentId ||
    !razorpaySignature ||
    !plan ||
    !PLAN_AMOUNTS[plan]
  ) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // Verify HMAC-SHA256 signature
  const text = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(text)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const amountPaise = PLAN_AMOUNTS[plan];
  const listingLimit = PLAN_LIMITS[plan];
  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const tier = plan as BuilderPlanTier;

  // Upsert BuilderSubscription
  const subscription = await prisma.builderSubscription.upsert({
    where: { userId: session.uid },
    create: {
      userId: session.uid,
      tier,
      status: SubStatus.ACTIVE,
      currentPeriodEnd,
      listingLimit,
      amountPaise,
    },
    update: {
      tier,
      status: SubStatus.ACTIVE,
      currentPeriodEnd,
      listingLimit,
      amountPaise,
    },
  });

  // Create BuilderPayment record
  await prisma.builderPayment.create({
    data: {
      subscriptionId: subscription.id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amountPaise,
      status: "paid",
      plan,
    },
  });

  return NextResponse.json({ ok: true, subscriptionId: subscription.id });
}
