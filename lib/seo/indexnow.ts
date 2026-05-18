/**
 * IndexNow — free instant indexing protocol used by Bing, Yandex, Naver,
 * Seznam. Google still uses sitemap-based discovery, but pinging IndexNow
 * costs nothing and helps cover the long tail of search engines.
 *
 * Setup: set INDEXNOW_KEY env var to a random 32-char hex string and
 * serve it at /{key}.txt (a static file on the public bucket).
 */

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";

export async function pingIndexNow(urls: string[]): Promise<{ ok: boolean; status: number; pinged: number }> {
  const key = process.env.INDEXNOW_KEY;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!key || !site || urls.length === 0) {
    return { ok: false, status: 0, pinged: 0 };
  }
  // IndexNow caps each call at 10,000 URLs; we run with ≤100/day, well under.
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: site.replace(/^https?:\/\//, ""),
        key,
        keyLocation: `${site}/api/indexnow-key`,
        urlList: urls,
      }),
    });
    return { ok: res.ok, status: res.status, pinged: urls.length };
  } catch {
    return { ok: false, status: 0, pinged: 0 };
  }
}
