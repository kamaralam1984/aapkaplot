/**
 * One-shot DNS bootstrap script for the AapKaPlot domain.
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=...
 *   CLOUDFLARE_ZONE_ID=...
 *   npx tsx scripts/cf-dns-bootstrap.ts
 *
 * Creates / updates the bare minimum records:
 *   - @           → CNAME aapkaplot.pages.dev   (apex, CNAME flattening on)
 *   - www         → CNAME aapkaplot.pages.dev
 *   - media       → CNAME public-r2.cloudflarestorage.com
 *
 * Idempotent — safe to re-run.
 */

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE = process.env.CLOUDFLARE_ZONE_ID;
const ROOT = process.env.SITE_DOMAIN ?? "aapkaplot.com";

if (!TOKEN || !ZONE) {
  console.error("Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID env vars first.");
  process.exit(1);
}

const RECORDS: { type: string; name: string; content: string; proxied: boolean }[] = [
  { type: "CNAME", name: ROOT,            content: "aapkaplot.pages.dev",                 proxied: true  },
  { type: "CNAME", name: `www.${ROOT}`,   content: "aapkaplot.pages.dev",                 proxied: true  },
  { type: "CNAME", name: `media.${ROOT}`, content: "public-r2.cloudflarestorage.com",     proxied: true  },
];

const API = `https://api.cloudflare.com/client/v4/zones/${ZONE}/dns_records`;
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

async function main() {
  for (const rec of RECORDS) {
    const existing = await fetch(
      `${API}?type=${rec.type}&name=${encodeURIComponent(rec.name)}`,
      { headers: HEADERS }
    ).then((r) => r.json());

    const found = existing.result?.[0];

    if (found) {
      await fetch(`${API}/${found.id}`, {
        method: "PUT",
        headers: HEADERS,
        body: JSON.stringify(rec),
      });
      console.log(`✓ updated ${rec.type} ${rec.name}`);
    } else {
      await fetch(API, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(rec),
      });
      console.log(`✓ created ${rec.type} ${rec.name}`);
    }
  }
  console.log("\nDNS bootstrap complete.");
}

main().catch((e) => {
  console.error("[cf-dns]", e);
  process.exit(1);
});
