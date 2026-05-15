import { NextResponse } from "next/server";
import { z } from "zod";
import { issueMockOtp } from "@/lib/mock-otp-store";
import { verifyTurnstile } from "@/lib/turnstile";

const Body = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone"),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  // Cloudflare Turnstile gate (no-op if TURNSTILE_SECRET is unset).
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? undefined;
  const tsResult = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!tsResult.ok) {
    return NextResponse.json(
      { error: "bot_check_failed", codes: tsResult.errorCodes },
      { status: 403 }
    );
  }

  const { phone } = parsed.data;
  const { expiresInSec, code } = issueMockOtp(phone);
  return NextResponse.json({
    ok: true,
    expiresInSec,
    // exposed only in dev to make manual testing easy
    devHint: process.env.NODE_ENV === "production" ? undefined : code,
  });
}
