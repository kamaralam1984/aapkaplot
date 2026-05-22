import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/server/db";
import { SubStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  // Verify webhook signature
  if (webhookSecret) {
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      // Still return 200 to prevent Razorpay retries, but log the mismatch
      console.error("[razorpay-webhook] Invalid signature — ignoring event");
      return NextResponse.json({ ok: true });
    }
  }

  let event: { event: string; payload?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    switch (event.event) {
      case "payment.captured": {
        const payment = (event.payload as any)?.payment?.entity;
        if (!payment?.order_id) break;

        await prisma.builderPayment.updateMany({
          where: { razorpayOrderId: payment.order_id },
          data: {
            status: "paid",
            razorpayPaymentId: payment.id ?? undefined,
          },
        });

        // Update lifetimePaidPaise on the related subscription
        const bp = await prisma.builderPayment.findFirst({
          where: { razorpayOrderId: payment.order_id },
          select: { subscriptionId: true, amountPaise: true },
        });
        if (bp) {
          await prisma.builderSubscription.update({
            where: { id: bp.subscriptionId },
            data: {
              lifetimePaidPaise: { increment: bp.amountPaise },
            },
          });
        }
        break;
      }

      case "subscription.cancelled": {
        const sub = (event.payload as any)?.subscription?.entity;
        if (!sub?.id) break;

        await prisma.builderSubscription.updateMany({
          where: { razorpaySubId: sub.id },
          data: { status: SubStatus.CANCELLED },
        });
        break;
      }

      default:
        // Unhandled event — ignore silently
        break;
    }
  } catch (err) {
    // Log but always return 200 so Razorpay doesn't retry infinitely
    console.error("[razorpay-webhook] Handler error:", err);
  }

  return NextResponse.json({ ok: true });
}
