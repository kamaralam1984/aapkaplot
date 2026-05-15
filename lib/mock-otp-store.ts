/**
 * In-memory OTP store for the mock auth phase. Persists for the lifetime
 * of the Node process (HMR-stable via globalThis). Production wires this
 * to the OtpCode Prisma model in `server/auth/otp.ts`.
 */

import { createHash, randomInt } from "node:crypto";

interface OtpEntry {
  identifier: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
}

const globalForOtp = globalThis as unknown as { _akpOtp?: Map<string, OtpEntry> };
const store: Map<string, OtpEntry> =
  globalForOtp._akpOtp ?? (globalForOtp._akpOtp = new Map());

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LENGTH = 6;

function hash(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function issueMockOtp(identifier: string) {
  const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
  store.set(identifier, {
    identifier,
    codeHash: hash(code),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
  if (process.env.NODE_ENV !== "production") {
    console.log(`[mock-otp] ${identifier} -> ${code}`);
  }
  return { code, expiresInSec: OTP_TTL_MS / 1000 };
}

export function verifyMockOtp(identifier: string, code: string):
  | { ok: true }
  | { ok: false; reason: "expired" | "too-many-attempts" | "mismatch" | "not-found" } {
  const entry = store.get(identifier);
  if (!entry) return { ok: false, reason: "not-found" };
  if (Date.now() > entry.expiresAt) {
    store.delete(identifier);
    return { ok: false, reason: "expired" };
  }
  entry.attempts++;
  if (entry.attempts > OTP_MAX_ATTEMPTS) {
    store.delete(identifier);
    return { ok: false, reason: "too-many-attempts" };
  }
  if (entry.codeHash !== hash(code)) return { ok: false, reason: "mismatch" };
  store.delete(identifier);
  return { ok: true };
}
