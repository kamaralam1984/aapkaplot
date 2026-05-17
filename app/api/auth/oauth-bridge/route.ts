import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/server/db";
import { encodeSession, sessionCookie, type SessionRole } from "@/lib/session";
import { isSuperAdminEmail } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * NextAuth → AapKaPlot session bridge.
 *
 * After Google (or any other OAuth provider) completes, NextAuth sets its
 * own `next-auth.session-token` cookie — but the rest of the app reads our
 * custom `akp_session` cookie via getSession(). Without a bridge, the user
 * looks signed in to NextAuth but anonymous to every other route.
 *
 * Flow:
 *   1. The Google button on /auth/login submits to /api/auth/signin/google
 *      with callbackUrl=/api/auth/oauth-bridge?next=<original-target>.
 *   2. After Google approves, NextAuth lands here with the JWT cookie set.
 *   3. We decode the JWT, upsert the user in our User table (so all the
 *      OTP-flow code paths keep working), and issue an `akp_session` cookie
 *      with the canonical app shape.
 *   4. Redirect to ?next= or /me.
 */
function prismaRoleToSession(role: string): SessionRole {
  switch (role) {
    case "ADMIN":       return "admin";
    case "SUPER_ADMIN": return "super_admin";
    case "SELLER":      return "seller";
    case "AGENT":       return "agent";
    default:            return "buyer";
  }
}

/**
 * Resolve the public origin even when running behind a reverse proxy. PM2
 * + Cloudflare Tunnel terminate TLS at the edge, so inside Next.js
 * `req.url` looks like `http://localhost:3001/...`. We prefer the explicit
 * NEXTAUTH_URL / NEXT_PUBLIC_SITE_URL env vars, then the x-forwarded
 * headers Cloudflare sets, falling back to the raw URL only in dev.
 */
function siteOrigin(req: NextRequest): string {
  const env = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

function loginRedirect(req: NextRequest, error: string) {
  const url = new URL("/auth/login", siteOrigin(req));
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return loginRedirect(req, "auth_secret_missing");

  const token = await getToken({ req, secret });
  if (!token?.email) return loginRedirect(req, "oauth_no_email");

  const email = String(token.email).toLowerCase();
  const name = typeof token.name === "string" ? token.name : null;

  let uid: string;
  let role: SessionRole = "buyer";
  let finalName: string | undefined = name ?? undefined;

  if (process.env.USE_DB === "1") {
    const promote = isSuperAdminEmail(email);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      uid = existing.id;
      const target = promote && existing.role !== "SUPER_ADMIN" ? "SUPER_ADMIN" : existing.role;
      if (target !== existing.role) {
        await prisma.user.update({ where: { id: uid }, data: { role: target } });
      }
      role = prismaRoleToSession(target);
      finalName = existing.name ?? finalName;
    } else {
      const created = await prisma.user.create({
        data: {
          phone: `email:${email}`,
          email,
          name: name ?? null,
          role: promote ? "SUPER_ADMIN" : "BUYER",
          emailVerified: new Date(),
        },
      });
      uid = created.id;
      role = prismaRoleToSession(created.role);
    }
  } else {
    uid = `u_oauth_${Date.now().toString(36)}`;
    if (isSuperAdminEmail(email)) role = "super_admin";
  }

  const sessionToken = encodeSession({
    uid,
    email,
    name: finalName,
    role,
    iat: Math.floor(Date.now() / 1000),
  });

  const jar = await cookies();
  jar.set(sessionCookie.name, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionCookie.maxAge,
  });

  // Honor a same-origin `next=` query param (don't allow open redirects).
  const rawNext = req.nextUrl.searchParams.get("next") || "/me";
  const next = rawNext.startsWith("/") ? rawNext : "/me";
  return NextResponse.redirect(new URL(next, siteOrigin(req)));
}
