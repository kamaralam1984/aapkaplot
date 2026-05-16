/**
 * Stateless session helpers. Uses a signed cookie payload so we don't need a DB
 * during the mock phase. Swap for jose/jsonwebtoken once auth lands in prod.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "akp_session";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

export type SessionRole = "buyer" | "seller" | "agent" | "admin";

export interface Session {
  uid: string;
  // One of phone | email is always set. Phone OTP is parked; email is the
  // active identifier path until SMS provider is wired.
  phone?: string;
  email?: string;
  name?: string;
  role: SessionRole;
  iat: number;
}

function secret() {
  return process.env.JWT_SECRET ?? "dev-only-change-me";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(s: Session): string {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export const sessionCookie = {
  name: COOKIE_NAME,
  maxAge: COOKIE_MAX_AGE_SEC,
};

export function newUserId() {
  return `u_${randomBytes(8).toString("hex")}`;
}
