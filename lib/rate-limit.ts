/**
 * Sliding-window rate limiter for API routes.
 *
 * In-memory only — fine for a single-PM2-process deployment. When the app
 * scales to a cluster, swap the Map for Redis (`SETEX` with the same key).
 *
 * Typical use inside a route handler:
 *
 *   const blocked = await rateLimit(req, { key: "offer", limit: 10, windowMs: 60_000 });
 *   if (blocked) return blocked;
 *
 * Returns a `NextResponse` with 429 when the caller is over budget;
 * otherwise `null` so the handler keeps running.
 */
import { NextResponse } from "next/server";

interface RateLimitOpts {
  /** Bucket name — pick one per endpoint group (e.g. "offer", "upload"). */
  key: string;
  /** Max requests per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

interface Hit {
  ts: number[];
}

const globalForLimiter = globalThis as unknown as { _akpRateMap?: Map<string, Hit> };
const buckets: Map<string, Hit> =
  globalForLimiter._akpRateMap ?? (globalForLimiter._akpRateMap = new Map());

/**
 * Resolve the caller's identity to a rate-limit key.
 *  - Behind Cloudflare Tunnel, `cf-connecting-ip` is the real client IP.
 *  - Behind plain Vercel / NGINX it falls back to `x-forwarded-for`.
 *  - Localhost (or anywhere headers are missing) hashes to "local".
 */
function clientKey(req: Request): string {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
    "local"
  );
}

export async function rateLimit(req: Request, opts: RateLimitOpts): Promise<NextResponse | null> {
  const ip = clientKey(req);
  const bucketKey = `${opts.key}:${ip}`;
  const now = Date.now();
  const cutoff = now - opts.windowMs;

  const existing = buckets.get(bucketKey) ?? { ts: [] };
  // Drop expired hits.
  existing.ts = existing.ts.filter((t) => t > cutoff);

  if (existing.ts.length >= opts.limit) {
    const retryAfterMs = (existing.ts[0] ?? now) + opts.windowMs - now;
    return NextResponse.json(
      { error: "rate_limited", retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(1, Math.ceil(retryAfterMs / 1000)).toString(),
          "X-RateLimit-Limit": opts.limit.toString(),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  existing.ts.push(now);
  buckets.set(bucketKey, existing);
  return null;
}
