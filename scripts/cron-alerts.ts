/**
 * AapKaPlot — saved-search alert dispatcher.
 *
 * Run nightly:
 *   tsx scripts/cron-alerts.ts                   # all due alerts
 *   tsx scripts/cron-alerts.ts --freq=instant    # specific cadence
 *
 * On Linux/VPS — schedule via cron:
 *   0 3 * * *   cd /srv/aapkaplot && pnpm exec tsx scripts/cron-alerts.ts --freq=daily
 *   0 4 * * 1   cd /srv/aapkaplot && pnpm exec tsx scripts/cron-alerts.ts --freq=weekly
 *
 * Email goes via Resend (free 3000/mo) when RESEND_API_KEY is set,
 * else falls back to console for dev. No paid dependencies.
 */
import { prisma } from "@/server/db";
import { findNearbyProperties } from "@/server/property/geo";
import { sendEmail } from "@/lib/email";
import { formatInr } from "@/lib/format";

const FREQ_WINDOW_HOURS: Record<string, number> = {
  instant: 1,
  daily: 24,
  weekly: 24 * 7,
};

interface AlertQuery {
  intent?: string;
  kind?: string;
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  radiusKm?: number;
  origin?: { lat: number; lng: number };
}

async function findMatches(q: AlertQuery, sinceIso: string) {
  // PostGIS-backed when origin/radius supplied, else simple Prisma filter.
  if (q.origin && q.radiusKm) {
    return findNearbyProperties({
      lat: q.origin.lat,
      lng: q.origin.lng,
      radiusKm: q.radiusKm,
      limit: 25,
      kind: q.kind?.toUpperCase(),
      intent: q.intent?.toUpperCase(),
      priceMin: q.budgetMin,
      priceMax: q.budgetMax,
    });
  }
  return prisma.property.findMany({
    where: {
      status: "ACTIVE",
      city: q.city ?? undefined,
      kind: q.kind ? (q.kind.toUpperCase() as never) : undefined,
      intent: q.intent ? (q.intent.toUpperCase() as never) : undefined,
      priceInr: {
        gte: q.budgetMin ?? undefined,
        lte: q.budgetMax ?? undefined,
      },
      createdAt: { gte: new Date(sinceIso) },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
}

function renderEmail(label: string, matches: Array<{ id: string; title: string; priceInr: number; city: string; locality: string }>) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com";
  const items = matches
    .slice(0, 10)
    .map(
      (m) => `
        <li style="padding:12px 0;border-bottom:1px solid #e5e7eb">
          <a href="${baseUrl}/property/${m.id}" style="font-weight:600;color:#111827;text-decoration:none">${m.title}</a>
          <div style="color:#6b7280;font-size:13px">${m.locality}, ${m.city} · <strong>${formatInr(m.priceInr)}</strong></div>
        </li>`
    )
    .join("");

  return {
    subject: `${matches.length} new match${matches.length === 1 ? "" : "es"} for "${label}"`,
    text: `${matches.length} new properties match your alert "${label}". See them at ${baseUrl}.`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
        <h1 style="font-size:20px;margin:0 0 8px">${matches.length} new ${matches.length === 1 ? "match" : "matches"} for "${label}"</h1>
        <p style="color:#475569;margin:0 0 16px">Here are the latest properties that match your saved search.</p>
        <ul style="list-style:none;padding:0;margin:0">${items}</ul>
        <p style="margin-top:20px"><a href="${baseUrl}/me/alerts" style="color:#2563eb">Manage your alerts</a></p>
      </div>`,
  };
}

async function run() {
  const freqArg = process.argv.find((a) => a.startsWith("--freq="))?.split("=")[1];
  const frequencies = freqArg ? [freqArg] : Object.keys(FREQ_WINDOW_HOURS);

  let sent = 0;
  let skipped = 0;

  for (const freq of frequencies) {
    const windowHours = FREQ_WINDOW_HOURS[freq];
    if (!windowHours) continue;

    const alerts = await prisma.savedSearch.findMany({
      where: { active: true, frequency: freq },
      include: { user: { select: { email: true, name: true } } },
    });

    for (const a of alerts) {
      // Re-send guard: skip if lastSentAt within window.
      if (a.lastSentAt && Date.now() - a.lastSentAt.getTime() < windowHours * 3600 * 1000) {
        skipped++;
        continue;
      }
      if (!a.user.email) {
        skipped++;
        continue;
      }

      const since = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();
      const matches = (await findMatches(a.query as AlertQuery, since)) as Array<{
        id: string; title: string; priceInr: number; city: string; locality: string;
      }>;

      if (matches.length === 0) {
        skipped++;
        continue;
      }

      const { subject, html, text } = renderEmail(a.label, matches);
      await sendEmail({ to: a.user.email, subject, html, text });

      await prisma.savedSearch.update({
        where: { id: a.id },
        data: { lastSentAt: new Date() },
      });
      sent++;
    }
  }

  console.log(`[cron-alerts] sent=${sent} skipped=${skipped}`);
}

run().catch((err) => {
  console.error("[cron-alerts] failed", err);
  process.exit(1);
});
