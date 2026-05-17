/**
 * Neighbourhood narrative generator.
 *
 * Stage 1: pure-JS rule-based writer that turns a PropertyPoiBundle into
 * 2-3 natural-sounding paragraphs. Zero API calls, zero cost, deterministic.
 *
 * Stage 2 (optional): if CF_ACCOUNT_ID + CF_API_TOKEN are set, the rule-based
 * draft is sent to Cloudflare Workers AI (free pool) to be paraphrased into
 * smoother prose. Falls back to the rule-based output on any failure.
 *
 * No OpenAI / no paid services involved.
 */
import type { PropertyPoiBundle, PoiCategory, Poi } from "./property-poi";

interface Context {
  propertyTitle?: string;
  kind?: string;        // "flat" | "house" | "plot" | …
  locality?: string;
  city?: string;
  bhk?: number;
  intent?: "buy" | "rent" | "sell";
}

function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function nearest(byCat: Partial<Record<PoiCategory, Poi[]>>, cat: PoiCategory): Poi | null {
  return byCat[cat]?.[0] ?? null;
}

function countWithin(byCat: Partial<Record<PoiCategory, Poi[]>>, cat: PoiCategory, maxKm: number): number {
  return byCat[cat]?.filter((p) => p.distanceKm <= maxKm).length ?? 0;
}

/** Pure rule-based narrative — always available, no network. */
export function ruleBasedNarrative(bundle: PropertyPoiBundle, ctx: Context = {}): string {
  const by = bundle.byCategory;
  const where = ctx.locality && ctx.city ? `${ctx.locality}, ${ctx.city}` : ctx.city ?? "this area";
  const home =
    ctx.bhk && (ctx.kind === "flat" || ctx.kind === "house" || ctx.kind === "villa")
      ? `${ctx.bhk} BHK ${ctx.kind}`
      : ctx.kind ?? "property";

  const paragraphs: string[] = [];

  // Para 1 — connectivity (metro / railway / airport)
  const metro = nearest(by, "metro");
  const railway = nearest(by, "railway");
  const airport = nearest(by, "airport");
  const connectivity: string[] = [];
  if (metro) connectivity.push(`a ${formatKm(metro.distanceKm)} walk from the ${metro.name} metro entry`);
  if (railway) connectivity.push(`${formatKm(railway.distanceKm)} from ${railway.name} railway station`);
  if (airport) connectivity.push(`a ${formatKm(airport.distanceKm)} drive to ${airport.name}`);
  if (connectivity.length > 0) {
    paragraphs.push(
      `This ${home} in ${where} is well connected — ${joinWithAnd(connectivity)}. ` +
      `Daily commute and weekend getaways are equally convenient.`
    );
  } else {
    paragraphs.push(
      `This ${home} sits in a quiet pocket of ${where}, away from the immediate buzz of major transit hubs.`
    );
  }

  // Para 2 — daily life (hospitals, schools, shopping)
  const hospital = nearest(by, "hospital");
  const schoolsClose = countWithin(by, "school", 2);
  const mall = nearest(by, "mall") ?? nearest(by, "supermarket");
  const dailyBits: string[] = [];
  if (hospital) dailyBits.push(`${hospital.name} hospital ${formatKm(hospital.distanceKm)} away`);
  if (schoolsClose > 0) dailyBits.push(`${schoolsClose} school${schoolsClose === 1 ? "" : "s"} within 2 km`);
  if (mall) dailyBits.push(`shopping at ${mall.name} (${formatKm(mall.distanceKm)})`);
  const banksAtms = countWithin(by, "bank", 1) + countWithin(by, "atm", 1);
  if (banksAtms >= 3) dailyBits.push(`${banksAtms} banks/ATMs within walking distance`);
  if (dailyBits.length > 0) {
    paragraphs.push(`For daily life you'll find ${joinWithAnd(dailyBits)}.`);
  }

  // Para 3 — lifestyle (parks, heritage, tourism, restaurants)
  const park = nearest(by, "park");
  const heritage = nearest(by, "historical");
  const tourism = nearest(by, "tourism");
  const restaurantsClose = countWithin(by, "restaurant", 1);
  const lifestyleBits: string[] = [];
  if (park) lifestyleBits.push(`green space at ${park.name} (${formatKm(park.distanceKm)})`);
  if (heritage) lifestyleBits.push(`heritage landmark ${heritage.name} just ${formatKm(heritage.distanceKm)} away`);
  if (tourism) lifestyleBits.push(`tourist draw ${tourism.name} ${formatKm(tourism.distanceKm)}`);
  if (restaurantsClose >= 5) lifestyleBits.push(`a thriving food scene with ${restaurantsClose}+ restaurants within 1 km`);
  if (lifestyleBits.length > 0) {
    paragraphs.push(`The neighbourhood blends function with lifestyle: ${joinWithAnd(lifestyleBits)}.`);
  }

  // Investment closer
  const investmentSignals: string[] = [];
  if (metro && metro.distanceKm < 1) investmentSignals.push("walk-to-metro");
  if (countWithin(by, "school", 2) >= 3) investmentSignals.push("strong school catchment");
  if (countWithin(by, "hospital", 2) >= 2) investmentSignals.push("hospital-rich micro-market");
  if (heritage || tourism) investmentSignals.push("heritage tourism upside");
  if (investmentSignals.length > 0) {
    paragraphs.push(
      `Investment angle: ${joinWithAnd(investmentSignals)} — these factors typically support rental yield and resale value in Indian micro-markets.`
    );
  }

  return paragraphs.join("\n\n");
}

/**
 * Try to upgrade the rule-based draft into smoother prose using Cloudflare
 * Workers AI (free pool, no SDK). Returns the original draft on any failure.
 *
 * Set CF_AI_MODEL to override (default: llama-3.1-8b-instruct).
 */
async function polishWithCloudflareAI(draft: string): Promise<string | null> {
  const account = process.env.CF_ACCOUNT_ID;
  const token = process.env.CF_API_TOKEN;
  if (!account || !token) return null;

  const model = process.env.CF_AI_MODEL ?? "@cf/meta/llama-3.1-8b-instruct";
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`;

  const prompt = `You are a concise, factual real-estate copywriter.
Rewrite the following neighbourhood description to flow naturally without losing or inventing any facts.
Keep the same numbers, names, and distances. Output 2–3 short paragraphs, no headings, no bullets.

DRAFT:
${draft}

REWRITE:`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful real-estate copywriter." },
          { role: "user", content: prompt },
        ],
        max_tokens: 380,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: { response?: string } };
    const out = json.result?.response?.trim();
    return out && out.length > 80 ? out : null;
  } catch {
    return null;
  }
}

export interface Narrative {
  text: string;
  source: "rule" | "cloudflare-ai";
}

/**
 * Public entrypoint. Always returns SOMETHING — never throws.
 *   1. Generate rule-based draft (instant, no network).
 *   2. If CF Workers AI is configured, paraphrase via free tier.
 *   3. Fall back to the rule-based draft on any failure.
 */
export async function generateNeighbourhoodNarrative(
  bundle: PropertyPoiBundle,
  ctx: Context = {}
): Promise<Narrative> {
  const draft = ruleBasedNarrative(bundle, ctx);
  if (!draft) return { text: "", source: "rule" };

  const polished = await polishWithCloudflareAI(draft);
  if (polished) return { text: polished, source: "cloudflare-ai" };

  return { text: draft, source: "rule" };
}
