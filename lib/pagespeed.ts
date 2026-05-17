/**
 * Thin wrapper around Google's free PageSpeed Insights v5 API. Anonymous
 * usage works for low volume; set PAGESPEED_API_KEY in env for higher
 * quotas (free tier ~25k queries/day with a key).
 *
 * Docs: https://developers.google.com/speed/docs/insights/v5/get-started
 */

export type Strategy = "mobile" | "desktop";

export interface PageSpeedScores {
  url: string;
  strategy: Strategy;
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  lcpMs: number | null;
  clsX1000: number | null;
  inpMs: number | null;
  ttfbMs: number | null;
  fcpMs: number | null;
  raw: unknown;
}

const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

function pickScore(audit: unknown): number | null {
  if (!audit || typeof audit !== "object") return null;
  const score = (audit as { score?: number | null }).score;
  if (typeof score !== "number") return null;
  return Math.round(score * 100);
}

function pickMs(audit: unknown): number | null {
  if (!audit || typeof audit !== "object") return null;
  const v = (audit as { numericValue?: number }).numericValue;
  return typeof v === "number" ? Math.round(v) : null;
}

function pickCls(audit: unknown): number | null {
  if (!audit || typeof audit !== "object") return null;
  const v = (audit as { numericValue?: number }).numericValue;
  return typeof v === "number" ? Math.round(v * 1000) : null;
}

export async function fetchPageSpeed(
  url: string,
  strategy: Strategy = "mobile",
  signal?: AbortSignal,
): Promise<PageSpeedScores> {
  const params = new URLSearchParams({ url, strategy });
  for (const c of CATEGORIES) params.append("category", c);
  const key = process.env.PAGESPEED_API_KEY;
  if (key) params.set("key", key);

  const r = await fetch(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`,
    { signal, headers: { Accept: "application/json" } },
  );
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`PageSpeed ${r.status}: ${body.slice(0, 200)}`);
  }
  const data = (await r.json()) as {
    lighthouseResult?: {
      categories?: Record<string, { score?: number | null } | undefined>;
      audits?: Record<string, unknown>;
    };
  };
  const cats = data.lighthouseResult?.categories ?? {};
  const audits = data.lighthouseResult?.audits ?? {};

  return {
    url,
    strategy,
    performance: pickScore(cats["performance"]),
    accessibility: pickScore(cats["accessibility"]),
    bestPractices: pickScore(cats["best-practices"]),
    seo: pickScore(cats["seo"]),
    lcpMs: pickMs(audits["largest-contentful-paint"]),
    clsX1000: pickCls(audits["cumulative-layout-shift"]),
    inpMs: pickMs(audits["interaction-to-next-paint"]) ?? pickMs(audits["interactive"]),
    ttfbMs: pickMs(audits["server-response-time"]),
    fcpMs: pickMs(audits["first-contentful-paint"]),
    raw: data.lighthouseResult ?? null,
  };
}
