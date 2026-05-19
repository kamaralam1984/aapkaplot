import { NextResponse } from "next/server";
import { z } from "zod";
import { issueMockOtp } from "@/lib/mock-otp-store";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendEmail, otpEmailContent } from "@/lib/email";

const Body = z.object({
  email: z.string().email("Invalid email"),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
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

  const email = parsed.data.email.toLowerCase().trim();
  const { expiresInSec, code } = issueMockOtp(email);

  const { subject, html, text } = otpEmailContent(code);
  const sent = await sendEmail({ to: email, subject, html, text });

  if (!sent.ok) {
    console.error(`[otp/send] delivery failed for ${email}: ${sent.error}`);
    return NextResponse.json(
      { error: "email_delivery_failed", detail: sent.error },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    expiresInSec,
    via: sent.via,
    // exposed only in dev to make manual testing easy
    devHint: process.env.NODE_ENV === "production" ? undefined : code,
  });
}
