/**
 * Google Search Console — last-28-day performance pull.
 *
 * GSC API is FREE but needs OAuth. Setup (one-time):
 *   1. Create a Google Cloud project, enable the Search Console API.
 *   2. Create an OAuth 2.0 Client ID (type: web), add redirect URI.
 *   3. Run a one-off auth flow to get a refresh token.
 *   4. Set env vars:
 *        GSC_CLIENT_ID
 *        GSC_CLIENT_SECRET
 *        GSC_REFRESH_TOKEN
 *        GSC_SITE_URL  (e.g. sc-domain:aapkaplot.com)
 *
 * Until those are set this module returns a `notConfigured` status so the
 * admin panel can show a friendly "Configure GSC" message instead of a
 * cryptic OAuth error.
 *
 * No external SDK required — direct REST calls keep the install footprint
 * small and avoid pulling in google-auth-library.
 */

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_QUERY_URL = (site: string) =>
  `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;

export interface GscRow {
  page: string;          // full URL
  clicks: number;
  impressions: number;
  ctr: number;           // 0..1
  position: number;      // average position
}

export type GscResult =
  | { status: "ok"; rows: GscRow[]; siteUrl: string; range: { start: string; end: string } }
  | { status: "notConfigured"; reason: string }
  | { status: "error"; code: string; message: string };

function isConfigured(): boolean {
  return !!(
    process.env.GSC_CLIENT_ID &&
    process.env.GSC_CLIENT_SECRET &&
    process.env.GSC_REFRESH_TOKEN &&
    process.env.GSC_SITE_URL
  );
}

async function getAccessToken(): Promise<string | null> {
  const params = new URLSearchParams({
    client_id: process.env.GSC_CLIENT_ID!,
    client_secret: process.env.GSC_CLIENT_SECRET!,
    refresh_token: process.env.GSC_REFRESH_TOKEN!,
    grant_type: "refresh_token",
  });
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

/** Pull last-28-day per-URL performance for the entire property. */
export async function fetchGscPerformance(): Promise<GscResult> {
  if (!isConfigured()) {
    return {
      status: "notConfigured",
      reason: "Set GSC_CLIENT_ID, GSC_CLIENT_SECRET, GSC_REFRESH_TOKEN and GSC_SITE_URL to enable Search Console sync.",
    };
  }
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return { status: "error", code: "invalid_grant", message: "OAuth refresh failed — refresh token may be expired or revoked." };
    }
    const end = new Date();
    const start = new Date(end.getTime() - 28 * 86400 * 1000);
    const body = {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      dimensions: ["page"],
      rowLimit: 25000,
    };
    const res = await fetch(GSC_QUERY_URL(process.env.GSC_SITE_URL!), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { status: "error", code: String(res.status), message: text.slice(0, 200) };
    }
    const data = await res.json();
    type RawRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };
    const rows: GscRow[] = (data.rows ?? []).map((r: RawRow) => ({
      page: r.keys?.[0] ?? "",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    }));
    return {
      status: "ok",
      siteUrl: process.env.GSC_SITE_URL!,
      range: { start: body.startDate, end: body.endDate },
      rows,
    };
  } catch (err) {
    return { status: "error", code: "exception", message: (err as Error).message };
  }
}
