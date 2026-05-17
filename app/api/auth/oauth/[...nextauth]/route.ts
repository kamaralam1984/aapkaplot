import { NextResponse } from "next/server";
import { buildProviders, isOAuthConfigured } from "@/lib/auth-providers";
import { importOptional } from "@/lib/optional-import";

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

/** Same unwrap dance as buildProviders — CJS-via-ESM-dynamic-import may
 *  double-wrap the default export. */
function unwrapCallable(mod: unknown): ((cfg: unknown) => unknown) | null {
  if (typeof mod === "function") return mod as (cfg: unknown) => unknown;
  if (mod && typeof mod === "object") {
    const m = mod as { default?: unknown };
    if (typeof m.default === "function") return m.default as (cfg: unknown) => unknown;
    if (m.default && typeof m.default === "object") {
      const inner = (m.default as { default?: unknown }).default;
      if (typeof inner === "function") return inner as (cfg: unknown) => unknown;
    }
  }
  return null;
}

async function loadHandler() {
  if (!isOAuthConfigured()) return null;
  try {
    const mod = await importOptional<unknown>("next-auth");
    const NextAuth = unwrapCallable(mod);
    if (!NextAuth) {
      console.warn(
        "[auth/oauth] next-auth default export is not callable. shape:",
        Object.keys((mod as object) ?? {})
      );
      return null;
    }
    const providers = await buildProviders();
    if (providers.length === 0) return null;
    return NextAuth({
      providers,
      session: { strategy: "jwt" },
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-only-change-me",
      pages: { signIn: "/auth/login" },
    });
  } catch (err) {
    console.warn("[auth/oauth] next-auth not available:", (err as Error).message);
    return null;
  }
}

type RouteHandler = (req: Request, ctx: unknown) => Promise<Response> | Response;

const handlerPromise: Promise<RouteHandler | null> = loadHandler() as Promise<RouteHandler | null>;

export async function GET(req: Request, ctx: unknown) {
  const handler = await handlerPromise;
  if (!handler) return notAvailable();
  return handler(req, ctx);
}
export async function POST(req: Request, ctx: unknown) {
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
