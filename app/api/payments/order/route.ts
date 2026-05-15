import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { importOptional } from "@/lib/optional-import";

const PLAN_PRICE: Record<string, number> = {
  spotlight: 499,
  featured:  1499,
  turbo:     2999,
  premium:   999,
};

const Body = z.object({
  plan: z.string().min(1),
  receipt: z.string().max(60).optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const baseInr = PLAN_PRICE[parsed.data.plan];
  if (!baseInr) {
    return NextResponse.json({ error: "unknown_plan" }, { status: 400 });
  }
  const amount = Math.round(baseInr * 1.18 * 100); // INR → paise, 18% GST
  const currency = "INR";
  const receipt = parsed.data.receipt ?? `akp_${Date.now()}_${session.uid}`;

  // 1) Real Razorpay path — requires RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET.
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      const mod = await importOptional<any>("razorpay");
      if (!mod) throw new Error("razorpay_sdk_missing");
      const Razorpay = mod.default ?? mod;
      const client = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const order = await client.orders.create({
        amount,
        currency,
        receipt,
        notes: { plan: parsed.data.plan, uid: session.uid },
      });
      return NextResponse.json({
        ok: true,
        mode: "razorpay",
        order,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err) {
      console.warn("[payments/order] razorpay failed, falling back to sim:", (err as Error).message);
    }
  }

  // 2) Simulated order — for demo + dev without keys.
  return NextResponse.json({
    ok: true,
    mode: "simulated",
    order: {
      id: `order_sim_${Math.random().toString(36).slice(2, 12)}`,
      amount,
      currency,
      receipt,
      status: "created",
    },
  });
}
