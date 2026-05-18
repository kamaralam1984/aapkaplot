/**
 * AI grahak/lead matcher.
 *
 * Two flows:
 *   1. body.leadId — pull an Inquiry row and find best matching active listings.
 *   2. body.criteria — match against ad-hoc criteria { budget, city, locality, kind, intent }.
 *
 * The DB does a fast pre-filter (price/city/kind), then OpenAI ranks
 * the top 25 candidates by fit and explains why for each shortlist.
 *
 * Returns: { matches: [{ propertyId, score, reason }] }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/app/api/admin/seo/_auth";
import { complete } from "@/lib/ai/openai";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const Criteria = z.object({
  city: z.string().optional(),
  locality: z.string().optional(),
  kind: z.enum(["PLOT", "FLAT", "HOUSE", "VILLA", "SHOP", "OFFICE", "WAREHOUSE", "AGRICULTURE"]).optional(),
  intent: z.enum(["BUY", "RENT", "SELL"]).optional(),
  budgetMaxInr: z.coerce.number().int().positive().optional(),
  bhk: z.coerce.number().int().min(1).max(10).optional(),
});

const Body = z.object({
  leadId: z.string().optional(),
  criteria: Criteria.optional(),
  shortlist: z.coerce.number().int().min(1).max(10).default(5),
});

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

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  // Resolve criteria from leadId if given.
  let criteria = parsed.data.criteria ?? {};
  let leadSummary = "";
  if (parsed.data.leadId) {
    const lead = await prisma.inquiry.findUnique({ where: { id: parsed.data.leadId } });
    if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });
    if (lead.location) criteria.locality = lead.location;
    if (lead.budgetInr) criteria.budgetMaxInr = Number(lead.budgetInr);
    leadSummary = `${lead.name} from ${lead.location ?? "(no location)"} · budget ${lead.budgetInr ? `₹${Number(lead.budgetInr).toLocaleString("en-IN")}` : "unspecified"} · message: ${lead.message ?? "—"}`;
  }

  // Pre-filter in SQL: cheap, narrows the LLM input.
  const where: Prisma.PropertyWhereInput = { status: "ACTIVE" };
  if (criteria.city) where.city = { contains: criteria.city, mode: "insensitive" };
  if (criteria.locality) where.locality = { contains: criteria.locality, mode: "insensitive" };
  if (criteria.kind) where.kind = criteria.kind;
  if (criteria.intent) where.intent = criteria.intent;
  if (criteria.budgetMaxInr) where.priceInr = { lte: criteria.budgetMaxInr };
  if (criteria.bhk) where.bhk = criteria.bhk;

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
    return NextResponse.json({ matches: [], reason: "no_active_listings_match" });
  }

  // Hand the candidates to OpenAI for ranking + reasoning.
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

  const system = [
    "You are AapKaPlot's grahak (buyer) matcher.",
    "Score how well each listing fits the prospect's stated preferences from 0-100.",
    "Verified listings get a +5 bonus. Listings far above budget get penalised.",
    "Return JSON: { \"matches\": [{ \"id\": string, \"score\": number, \"reason\": string }] }",
    `Order by score desc, return at most ${parsed.data.shortlist} entries.`,
    "Reason should be ≤ 25 words, plain English/Hinglish, concrete (mention amenity, price gap, or location fit).",
  ].join(" ");

  const userMsg = [
    leadSummary ? `Prospect: ${leadSummary}` : "",
    `Criteria: ${JSON.stringify(criteria)}`,
    `Candidates (${compact.length}):\n${JSON.stringify(compact, null, 2)}`,
  ].filter(Boolean).join("\n\n");

  const result = await complete({
    messages: [
      { role: "system", content: system },
      { role: "user", content: userMsg },
    ],
    temperature: 0.3,
    maxTokens: 700,
    responseFormat: "json",
  });

  if (!result.ok) {
    // Heuristic fallback: nearest budget match + verified-first.
    const heuristic = compact.slice(0, parsed.data.shortlist).map((c) => ({
      id: c.id, score: c.verified ? 70 : 60, reason: `${c.where}, ${c.price}, ${c.type}${c.verified ? " (verified)" : ""}`,
    }));
    return NextResponse.json({ matches: heuristic, source: "fallback", reason: result.reason });
  }

  try {
    const obj = JSON.parse(result.text);
    if (Array.isArray(obj.matches)) {
      return NextResponse.json({ matches: obj.matches, source: result.source, model: result.model });
    }
  } catch { /* fall through */ }

  return NextResponse.json({ matches: [], source: "fallback", reason: "OpenAI returned non-JSON" });
}
