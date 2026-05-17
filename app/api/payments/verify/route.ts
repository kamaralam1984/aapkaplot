import { NextResponse } from "next/server";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

const Body = z.object({
  razorpay_order_id:    z.string().min(8),
  razorpay_payment_id:  z.string().min(8),
  razorpay_signature:   z.string().min(40),
  plan:                 z.string().min(1),
  amountInr:            z.number().int().positive().optional(),
  propertyId:           z.string().min(1).optional(),
});

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// plan slug → activation window. Slug shape: "<kind>-<days>d" (e.g. "boost-7d").
function planActivation(plan: string): { kind: "boost" | "feature" | null; days: number } {
  const m = plan.match(/^(boost|feature)-(\d+)d$/i);
  if (!m) return { kind: null, days: 0 };
  return { kind: m[1].toLowerCase() as "boost" | "feature", days: Number(m[2]) };
}

/**
 * Razorpay docs:
 *   signature = HMAC_SHA256(secret, `${order_id}|${payment_id}`)
 * Verified payment is persisted and the linked property (if any) is
 * boosted/featured by the plan duration.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "razorpay_not_configured" }, { status: 503 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    plan, amountInr, propertyId,
  } = parsed.data;

  const expected = createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (!safeEqual(expected, razorpay_signature)) {
    return NextResponse.json({ error: "signature_mismatch" }, { status: 400 });
  }

  let persisted = false;
  let activated: { propertyId: string; until: string; kind: "boost" | "feature" } | null = null;

  if (process.env.USE_DB === "1") {
    try {
      await prisma.payment.create({
        data: {
          userId: session.uid,
          propertyId: propertyId ?? null,
          plan,
          amountInr: amountInr ?? 0,
          provider: "razorpay",
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: "paid",
        },
      });
      persisted = true;

      const { kind, days } = planActivation(plan);
      if (propertyId && kind && days > 0) {
        const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        await prisma.property.update({
          where: { id: propertyId },
          data: kind === "boost" ? { boostedUntil: until } : { featuredUntil: until },
        });
        activated = { propertyId, until: until.toISOString(), kind };
      }
    } catch (err) {
      console.error("[razorpay] db_persist_failed", err);
    }
  }

  console.log(
    `[razorpay] ✓ verified plan=${plan} uid=${session.uid} payment=${razorpay_payment_id} persisted=${persisted}`
  );

  return NextResponse.json({ ok: true, persisted, activated });
}
