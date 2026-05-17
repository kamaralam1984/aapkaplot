import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

/**
 * Razorpay webhook receiver.
 *
 * Razorpay calls this server-to-server when a payment lifecycle event
 * fires (payment.captured, payment.failed, order.paid). It's the source
 * of truth for live mode — the client-side /verify flow can miss events
 * if the user closes the tab right after payment, but the webhook will
 * always fire.
 *
 * Dashboard setup (per environment):
 *   1. Razorpay Dashboard → Settings → Webhooks → Add new webhook
 *   2. URL  = https://aapkaplot.com/api/payments/webhook
 *   3. Secret = generate one, paste it into RAZORPAY_WEBHOOK_SECRET in
 *      .env.local on the VPS
 *   4. Events to subscribe to (minimum):
 *        payment.captured
 *        payment.failed
 *        order.paid
 *
 * Signature verification (per Razorpay docs):
 *   HMAC_SHA256(webhook_secret, raw_request_body) == X-Razorpay-Signature
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function planActivation(plan: string): { kind: "boost" | "feature" | null; days: number } {
  const m = plan?.match(/^(boost|feature)-(\d+)d$/i);
  if (!m) return { kind: null, days: 0 };
  return { kind: m[1].toLowerCase() as "boost" | "feature", days: Number(m[2]) };
}

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const sigHeader = req.headers.get("x-razorpay-signature") ?? "";
  const raw = await req.text(); // read RAW body — order matters for HMAC.

  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  if (!safeEqual(expected, sigHeader)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  // Body is JSON.
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const event = (payload as { event?: string }).event;

  // Extract the inner payment object regardless of event type.
  const p =
    (payload as { payload?: { payment?: { entity?: Record<string, unknown> } } })
      .payload?.payment?.entity ?? null;
  if (!p) {
    // Some events (order.paid) carry only an order entity; we treat those
    // as no-ops for now and ack the call so Razorpay stops retrying.
    return NextResponse.json({ ok: true, ignored: event ?? "unknown" });
  }

  const paymentId = String(p.id ?? "");
  const orderId = String(p.order_id ?? "");
  const amount = typeof p.amount === "number" ? p.amount : 0;
  const status = typeof p.status === "string" ? p.status : "unknown";
  const notes = (p.notes ?? {}) as Record<string, unknown>;
  const uid = typeof notes.uid === "string" ? notes.uid : null;
  const plan = typeof notes.plan === "string" ? notes.plan : "";
  const propertyId = typeof notes.propertyId === "string" ? notes.propertyId : null;

  if (event === "payment.captured" && process.env.USE_DB === "1" && uid) {
    try {
      // Idempotent insert keyed on paymentId (unique in the schema).
      await prisma.payment.upsert({
        where: { paymentId },
        update: { status: "paid" },
        create: {
          userId: uid,
          propertyId,
          plan: plan || "unknown",
          amountInr: Math.round(amount / 100),
          provider: "razorpay",
          orderId,
          paymentId,
          signature: sigHeader,
          status: "paid",
        },
      });

      const act = planActivation(plan);
      if (propertyId && act.kind) {
        const until = new Date(Date.now() + act.days * 24 * 60 * 60 * 1000);
        await prisma.property.update({
          where: { id: propertyId },
          data:
            act.kind === "boost"
              ? { boostedUntil: until }
              : { featuredUntil: until },
        });
      }
    } catch (err) {
      console.warn("[razorpay-webhook] db write failed:", (err as Error).message);
      // Still 200 — let Razorpay stop retrying; we logged it.
    }
  } else if (event === "payment.failed") {
    console.warn(`[razorpay-webhook] payment.failed paymentId=${paymentId} status=${status}`);
  }

  return NextResponse.json({ ok: true, event });
}
