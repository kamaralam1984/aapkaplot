import { NextResponse } from "next/server";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSession } from "@/lib/auth-server";

export const runtime = "nodejs";

const Body = z.object({
  razorpay_order_id:    z.string().min(8),
  razorpay_payment_id:  z.string().min(8),
  razorpay_signature:   z.string().min(40),
  plan:                 z.string().min(1),
});

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Razorpay docs:
 *   signature = HMAC_SHA256(secret, `${order_id}|${payment_id}`)
 * Returning success here means the payment is genuine and the order
 * can be marked paid in the DB (TODO once DB lands).
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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = parsed.data;

  const expected = createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (!safeEqual(expected, razorpay_signature)) {
    return NextResponse.json({ error: "signature_mismatch" }, { status: 400 });
  }

  // TODO once DB lands:
  //   await prisma.payment.create({ data: { uid: session.uid, plan, orderId: razorpay_order_id, paymentId: razorpay_payment_id, status: "paid" } });
  console.log(`[razorpay] ✓ verified plan=${plan} uid=${session.uid} payment=${razorpay_payment_id}`);

  return NextResponse.json({ ok: true });
}
