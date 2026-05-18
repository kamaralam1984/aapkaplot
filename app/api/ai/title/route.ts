import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/ai/title
 *
 * Generate 3 listing-title suggestions for a property. Sellers pick one
 * (or remix). Uses OpenAI; falls back to a template when key missing.
 */
const Body = z.object({
  kind: z.enum(["plot", "flat", "house", "villa", "shop", "office", "warehouse", "agriculture"]),
  bhk: z.number().int().min(0).max(20).optional(),
  areaSqft: z.number().int().min(50).max(1_000_000).optional(),
  locality: z.string().min(1).max(100),
  city: z.string().min(1).max(80),
  intent: z.enum(["buy", "rent", "sell"]).default("buy"),
});

export async function POST(req: Request) {
  const limited = await rateLimit(req, { key: "ai-title", limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const d = parsed.data;

  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt =
        `Generate 3 catchy but factual real-estate listing titles for an Indian audience.\n` +
        `Kind: ${d.kind}\n${d.bhk ? `BHK: ${d.bhk}\n` : ""}${d.areaSqft ? `Area: ${d.areaSqft} sqft\n` : ""}` +
        `Locality: ${d.locality}, ${d.city}\nIntent: ${d.intent === "rent" ? "rent" : "sale"}\n\n` +
        `Constraints:\n- 5–9 words each\n- No emojis, no clichés ("dream home", "luxurious"), no all-caps\n- Indian English\n- Include locality\n\nRespond as JSON: {"titles": ["...", "...", "..."]}`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          temperature: 0.85,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You write concise Indian real-estate listing titles. Output strict JSON." },
            { role: "user", content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(12_000),
      });
      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as { titles?: string[] };
        if (Array.isArray(parsed.titles) && parsed.titles.length > 0) {
          return NextResponse.json({ source: "openai", titles: parsed.titles.slice(0, 3) });
        }
      }
    } catch (err) {
      console.warn("[ai/title] openai failed:", (err as Error).message);
    }
  }

  // Template fallback.
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const bhkPart = d.bhk ? `${d.bhk} BHK ` : "";
  const areaPart = d.areaSqft ? `${d.areaSqft} sqft ` : "";
  return NextResponse.json({
    source: "template",
    titles: [
      `${bhkPart}${cap(d.kind)} in ${d.locality}, ${d.city}`,
      `${areaPart}${cap(d.kind)} for ${d.intent === "rent" ? "Rent" : "Sale"} · ${d.locality}`,
      `Spacious ${bhkPart}${cap(d.kind)} near ${d.locality}, ${d.city}`,
    ].filter((s) => s.trim().length > 0),
  });
}
