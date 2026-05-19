/**
 * Auto-match library — finds top-N property matches for a given Inquiry.
 *
 * Shared by:
 *   • POST /api/lead/inquiry (auto-reply path)
 *   • Cron /api/cron/auto-match-daily
 *   • Cron /api/cron/auto-followup
 *
 * Mirrors the logic of /api/ai/grahak-match but is callable as a function.
 * Falls back to a deterministic SQL-only ranking when OPENAI_API_KEY absent.
 */

import { prisma } from "@/server/db";
import type { Inquiry, Prisma } from "@prisma/client";
import { complete } from "@/lib/ai/openai";

export interface MatchResult {
  propertyId: string;
  title: string;
  city: string;
  locality: string;
  priceInr: number;
  score: number;          // 0-100
  reason: string;          // ≤25 words
}

export interface MatchOutput {
  matches: MatchResult[];
  source: "openai" | "fallback";
  reason?: string;
}

interface ListingRow {
  id: string;
  title: string;
  city: string;
  locality: string;
  priceInr: number;
  areaSqft: number;
  kind: string;
  intent: string;
  bhk: number | null;
  amenities: string[];
  verified: boolean;
}

/**
 * Find top-N matching ACTIVE properties for an Inquiry.
 * Pre-filters in SQL on budget/city/locality, then ranks with OpenAI.
 */
export async function matchInquiry(
  lead: Pick<Inquiry, "id" | "name" | "phone" | "email" | "budgetInr" | "location" | "message">,
  shortlistSize = 3,
): Promise<MatchOutput> {
  const budgetMax = lead.budgetInr ? Number(lead.budgetInr) : null;
  const where: Prisma.PropertyWhereInput = { status: "ACTIVE" };

  if (budgetMax && budgetMax > 0) {
    // Allow up to +25% above stated budget — grahaks often stretch.
    where.priceInr = { lte: Math.round(budgetMax * 1.25) };
  }
  if (lead.location && lead.location.trim().length >= 2) {
    where.OR = [
      { locality: { contains: lead.location, mode: "insensitive" } },
      { city: { contains: lead.location, mode: "insensitive" } },
    ];
  }

  const candidates = await prisma.property.findMany({
    where,
    select: {
      id: true, title: true, city: true, locality: true, priceInr: true,
      areaSqft: true, kind: true, intent: true, bhk: true, amenities: true, verified: true,
    },
    orderBy: [{ verified: "desc" }, { priceInr: "asc" }],
    take: 25,
  });

  if (candidates.length === 0) {
    return { matches: [], source: "fallback", reason: "no_active_listings_match" };
  }

  // Build a compact view for the LLM.
  const compact = candidates.map((c: ListingRow) => ({
    id: c.id,
    title: c.title,
    where: `${c.locality}, ${c.city}`,
    price: `₹${Math.round(c.priceInr / 100_000)}L`,
    area: `${c.areaSqft} sqft`,
    type: `${c.intent} ${c.kind}${c.bhk ? ` ${c.bhk}BHK` : ""}`,
    verified: c.verified,
    amenities: c.amenities.slice(0, 6),
  }));

  const leadSummary =
    `${lead.name} from ${lead.location ?? "(no location)"} · budget ` +
    `${budgetMax ? `₹${budgetMax.toLocaleString("en-IN")}` : "unspecified"} · ` +
    `message: ${lead.message ?? "—"}`;

  const system = [
    "You are AapKaPlot's grahak (buyer) matcher.",
    "Score how well each listing fits the prospect's stated preferences from 0-100.",
    "Verified listings get a +5 bonus. Listings far above budget get penalised.",
    'Return JSON: { "matches": [{ "id": string, "score": number, "reason": string }] }',
    `Order by score desc, return at most ${shortlistSize} entries.`,
    "Reason ≤ 25 words, plain English/Hinglish, concrete (mention amenity, price gap, or location fit).",
  ].join(" ");

  const user = [
    `Prospect: ${leadSummary}`,
    `Candidates (${compact.length}):\n${JSON.stringify(compact, null, 2)}`,
  ].join("\n\n");

  const r = await complete({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.3,
    maxTokens: 700,
    responseFormat: "json",
  });

  // Build a quick lookup so we can hydrate display fields.
  const byId = new Map(candidates.map((c) => [c.id, c]));

  if (r.ok) {
    try {
      const parsed = JSON.parse(r.text) as { matches?: { id: string; score: number; reason: string }[] };
      const rows = (parsed.matches ?? [])
        .map((m) => {
          const c = byId.get(m.id);
          if (!c) return null;
          return {
            propertyId: c.id,
            title: c.title,
            city: c.city,
            locality: c.locality,
            priceInr: c.priceInr,
            score: Math.max(0, Math.min(100, Math.round(m.score))),
            reason: (m.reason ?? "").slice(0, 240),
          } as MatchResult;
        })
        .filter((x): x is MatchResult => !!x)
        .slice(0, shortlistSize);
      return { matches: rows, source: "openai" };
    } catch {
      /* fall through to deterministic */
    }
  }

  // Deterministic fallback: verified first, then closest to budget.
  const rows = candidates
    .map((c) => {
      let score = c.verified ? 75 : 60;
      if (budgetMax) {
        const gap = Math.abs(c.priceInr - budgetMax) / budgetMax;
        score -= Math.min(40, Math.round(gap * 50));
      }
      const reason = c.verified
        ? `Verified ${c.kind.toLowerCase()} in ${c.locality}, ${c.areaSqft} sqft.`
        : `${c.kind.toLowerCase()} in ${c.locality}, ${c.areaSqft} sqft — verification pending.`;
      return {
        propertyId: c.id,
        title: c.title,
        city: c.city,
        locality: c.locality,
        priceInr: c.priceInr,
        score: Math.max(0, Math.min(100, score)),
        reason,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, shortlistSize);

  return { matches: rows, source: "fallback", reason: r.reason };
}
