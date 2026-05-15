/**
 * Server-side Turnstile verification helper.
 *
 *   TURNSTILE_SECRET — secret key from the Turnstile dashboard.
 *
 * Behaviour:
 *  - secret missing      → silently bypass (development convenience)
 *  - token empty         → reject with code "missing-token"
 *  - Cloudflare says no  → reject with the upstream error codes
 */

export interface TurnstileResult {
  ok: boolean;
  bypassed?: boolean;
  errorCodes?: string[];
}

export async function verifyTurnstile(token: string | null | undefined, remoteIp?: string): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return { ok: true, bypassed: true };
  if (!token) return { ok: false, errorCodes: ["missing-token"] };

  const body = new URLSearchParams();
  body.append("secret", secret);
  body.append("response", token);
  if (remoteIp) body.append("remoteip", remoteIp);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    if (data.success) return { ok: true };
    return { ok: false, errorCodes: data["error-codes"] ?? [] };
  } catch {
    // Treat Cloudflare outage as soft-pass — better than locking users out.
    return { ok: true, bypassed: true, errorCodes: ["cf-network-error"] };
  }
}
