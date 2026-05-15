import { prisma } from "@/server/db";
import { createHash, randomInt } from "node:crypto";

const OTP_TTL_MIN = 10;
const OTP_LENGTH = 6;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function issueOtp(identifier: string, channel: "phone" | "email") {
  const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60_000);

  await prisma.otpCode.create({
    data: {
      channel,
      identifier,
      codeHash: hashCode(code),
      expiresAt,
    },
  });

  // TODO: integrate Twilio / MSG91 / SES here.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[otp] ${channel} ${identifier} -> ${code}`);
  }

  return { expiresAt };
}

export async function verifyOtp(
  identifier: string,
  channel: "phone" | "email",
  code: string
) {
  const record = await prisma.otpCode.findFirst({
    where: {
      identifier,
      channel,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false as const, reason: "expired" };
  if (record.codeHash !== hashCode(code))
    return { ok: false as const, reason: "mismatch" };

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true as const };
}
