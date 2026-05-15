import { NextResponse } from "next/server";
import { buildProviders, isOAuthConfigured } from "@/lib/auth-providers";

/**
 * NextAuth catch-all route. Only mounts a real NextAuth handler when both
 * the `next-auth` package is installed AND at least one OAuth provider has
 * credentials in env. Otherwise it returns a 503 with a hint so the call
 * site can fall back to OTP login.
 *
 * To enable in production:
 *   npm install next-auth
 *   echo "AUTH_SECRET=..."  >> .env
 *   echo "GOOGLE_CLIENT_ID=..." >> .env
 *   echo "GOOGLE_CLIENT_SECRET=..." >> .env
 */

async function loadHandler() {
  if (!isOAuthConfigured()) return null;
  try {
    // @ts-expect-error — optional dep
    const NextAuth = (await import("next-auth")).default;
    const providers = await buildProviders();
    if (providers.length === 0) return null;
    return NextAuth({
      providers,
      session: { strategy: "jwt" },
      secret: process.env.AUTH_SECRET ?? "dev-only-change-me",
      pages: { signIn: "/auth/login" },
    });
  } catch (err) {
    console.warn("[auth/oauth] next-auth not available:", (err as Error).message);
    return null;
  }
}

const handlerPromise = loadHandler();

export async function GET(req: Request, ctx: any) {
  const handler = await handlerPromise;
  if (!handler) return notAvailable();
  return handler(req, ctx);
}
export async function POST(req: Request, ctx: any) {
  const handler = await handlerPromise;
  if (!handler) return notAvailable();
  return handler(req, ctx);
}

function notAvailable() {
  return NextResponse.json(
    {
      error: "oauth_not_configured",
      hint:
        "OAuth is unavailable. Install `next-auth` and set provider credentials " +
        "(e.g. GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET). The OTP flow at " +
        "/auth/login keeps working in the meantime.",
    },
    { status: 503 }
  );
}
