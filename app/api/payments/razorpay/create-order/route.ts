import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSession } from "@/lib/auth-server";

const PLAN_AMOUNTS: Record<string, number> = {
  STARTER:      299900,  // ₹2,999
  GROWTH:       999900,  // ₹9,999
  DOMINATOR:   4999900,  // ₹49,999
  LEAD_REVEAL:    4900,  // ₹49
  BOOST_7:      29900,   // ₹299 — 7-day featured listing
  BOOST_30:     99900,   // ₹999 — 30-day featured listing
  VALUATION:    19900,   // ₹199 — AI valuation PDF
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "payment_not_configured" }, { status: 503 });
  }

  const json = await req.json().catch(() => ({}));
  const { plan, propertyId } = json as { plan?: string; propertyId?: string };

  if (!plan || !PLAN_AMOUNTS[plan]) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const amount = PLAN_AMOUNTS[plan];

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `${plan.toLowerCase()}_${session.uid.slice(-6)}_${Date.now()}`,
    notes: { userId: session.uid, plan, ...(propertyId ? { propertyId } : {}) },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: "INR",
    keyId,
    plan,
  });
}
