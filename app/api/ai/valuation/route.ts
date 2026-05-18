import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/ai/valuation
 *
 * LLM-driven property valuation. Pulls 5 comparable ACTIVE properties
 * from the same locality (PostGIS not used here — locality string match
 * keeps it cheap), then asks OpenAI to estimate the fair price band.
 *
 * MVP: prices return a range from the LLM, plus the comparable set used.
 * Production-grade would train a regression on the historical sale +
 * verified deal data — for now this gets sellers a reasonable starting
 * number in seconds.
 *
 * Falls back to a deterministic median when OPENAI_API_KEY is missing.
 */
const Body = z.object({
  kind: z.enum(["plot", "flat", "house", "villa", "shop", "office", "warehouse", "agriculture"]),
  locality: z.string().min(1).max(100),
  city: z.string().min(1).max(80),
  areaSqft: z.number().int().min(50).max(1_000_000),
  bhk: z.number().int().min(0).max(20).optional(),
});

export async function POST(req: Request) {
  const limited = await rateLimit(req, { key: "ai-valuation", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  // Pull up to 5 comparable listings in the same locality + kind.
  let comps: { id: string; title: string; priceInr: number; areaSqft: number }[] = [];
  if (process.env.USE_DB === "1") {
    comps = await prisma.property.findMany({
      where: {
        status: "ACTIVE",
        kind: d.kind.toUpperCase() as "PLOT" | "FLAT" | "HOUSE" | "VILLA" | "SHOP" | "OFFICE" | "WAREHOUSE" | "AGRICULTURE",
        OR: [
          { locality: { equals: d.locality, mode: "insensitive" } },
          { city: { equals: d.city, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, priceInr: true, areaSqft: true },
    });
  }

  // Deterministic baseline: per-sqft median of comps × this listing's area.
  const compsPerSqft = comps
    .map((c) => (c.areaSqft > 0 ? c.priceInr / c.areaSqft : 0))
    .filter((x) => x > 0)
    .sort((a, b) => a - b);
  const medianPerSqft = compsPerSqft.length
    ? compsPerSqft[Math.floor(compsPerSqft.length / 2)]
    : 0;
  const heuristicEstimate = Math.round(medianPerSqft * d.areaSqft);

  // OpenAI path — preferred when configured.
  if (process.env.OPENAI_API_KEY && comps.length > 0) {
    try {
      const prompt =
        `Estimate a fair-market price range (low/expected/high) in ₹ for an Indian real-estate listing.\n` +
        `Kind: ${d.kind}\n` +
        `Locality: ${d.locality}, ${d.city}\n` +
        `Carpet area: ${d.areaSqft} sqft${d.bhk ? `, ${d.bhk} BHK` : ""}\n\n` +
        `Comparable listings (locality/kind):\n` +
        comps
          .map(
            (c, i) =>
              `${i + 1}. ${c.title} — ₹${c.priceInr.toLocaleString("en-IN")} for ${c.areaSqft} sqft (₹${c.areaSqft > 0 ? Math.round(c.priceInr / c.areaSqft).toLocaleString("en-IN") : "n/a"}/sqft)`,
          )
          .join("\n") +
        `\n\nRespond ONLY in this JSON shape: {"lowInr": <int>, "expectedInr": <int>, "highInr": <int>, "reasoning": "<2-sentence explanation>"}`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are an Indian real-estate valuation analyst. Output strict JSON." },
            { role: "user", content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const raw = data.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw) as { lowInr?: number; expectedInr?: number; highInr?: number; reasoning?: string };
        return NextResponse.json({
          source: "openai",
          lowInr: parsed.lowInr ?? Math.round(heuristicEstimate * 0.9),
          expectedInr: parsed.expectedInr ?? heuristicEstimate,
          highInr: parsed.highInr ?? Math.round(heuristicEstimate * 1.1),
          reasoning: parsed.reasoning ?? `Based on ${comps.length} comparable listing(s) in ${d.locality}.`,
          comps,
        });
      }
    } catch (err) {
      console.warn("[ai/valuation] openai failed:", (err as Error).message);
    }
  }

  return NextResponse.json({
    source: comps.length > 0 ? "heuristic" : "no_comps",
    lowInr: Math.round(heuristicEstimate * 0.9) || 0,
    expectedInr: heuristicEstimate,
    highInr: Math.round(heuristicEstimate * 1.1) || 0,
    reasoning:
      comps.length === 0
        ? "Not enough comparable listings in this locality yet — quote a price based on builder data + ask the local broker."
        : `Median of ${comps.length} comparable listings in ${d.locality}, scaled to ${d.areaSqft} sqft.`,
    comps,
  });
}
