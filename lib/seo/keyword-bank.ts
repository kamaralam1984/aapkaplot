/**
 * Keyword synonym bank — diversifies vocabulary so adjacent generated
 * pages never read like keyword-stuffed clones of each other.
 *
 * Rule of thumb (per [[seo-content-rules]]): never use the same noun/verb
 * for the same concept more than 3 times across a single 800-word page.
 *
 * The composer picks variants by hashing the page slug, so the choice is
 * deterministic (same URL → same wording on every render) but spread
 * across the surface area of all generated pages.
 */

import type { PropertyKindSlug, PropertyIntentSlug } from "./geo-dataset";

// ─────────────────────────────────────────────────────────────
// Generic synonym pools
// ─────────────────────────────────────────────────────────────

/** Words for "buy". 7 options keeps any single page from repeating. */
export const BUY_VERBS = [
  "buy", "purchase", "invest in", "acquire", "book", "own", "pick up",
];
export const BUY_NOUNS = [
  "purchase", "investment", "acquisition", "buying decision", "booking",
];

export const RENT_VERBS = [
  "rent", "lease", "take on rent", "hire", "move into", "occupy",
];
export const RENT_NOUNS = [
  "rental", "lease", "tenancy", "monthly rental", "rent agreement",
];

export const LOOKING_VERBS = [
  "looking for", "searching for", "hunting for", "in the market for",
  "scouting for", "shortlisting", "evaluating",
];

export const FIND_VERBS = [
  "find", "discover", "browse", "explore", "compare", "review", "shortlist",
];

// ─────────────────────────────────────────────────────────────
// Per-kind vocabulary — varied descriptors for the same property type
// ─────────────────────────────────────────────────────────────

export const KIND_PHRASES: Record<PropertyKindSlug, {
  singular: string[];      // “a plot”, “a parcel of land”
  plural: string[];        // “plots”, “residential plots”
  longTail: string[];      // descriptive phrases for body text
  buyerProfile: string[];  // who typically buys/rents this
}> = {
  plot: {
    singular: ["a plot", "a parcel of land", "a residential plot", "an open plot", "a piece of land"],
    plural: ["plots", "residential plots", "open plots", "developed plots", "land parcels"],
    longTail: ["RERA-approved plots", "freehold plots", "gated society plots", "corner plots", "north-facing plots"],
    buyerProfile: ["end users planning their own home", "long-term investors", "families looking to build", "NRIs holding land for appreciation"],
  },
  flat: {
    singular: ["a flat", "an apartment", "a unit", "a builder floor"],
    plural: ["flats", "apartments", "units", "builder floors"],
    longTail: ["2 BHK and 3 BHK flats", "ready-to-move apartments", "under-construction units", "semi-furnished flats"],
    buyerProfile: ["young professionals", "nuclear families", "first-time home buyers", "rental yield investors"],
  },
  house: {
    singular: ["a house", "an independent house", "a row house", "a bungalow"],
    plural: ["independent houses", "row houses", "kothis", "bungalows"],
    longTail: ["independent kothis", "duplex houses", "ground-plus-one houses", "row villas"],
    buyerProfile: ["joint families", "buyers wanting privacy", "self-occupants who value space"],
  },
  villa: {
    singular: ["a villa", "a luxury villa", "a private villa", "a gated villa"],
    plural: ["villas", "luxury villas", "gated villas", "premium villas"],
    longTail: ["4 BHK villas", "private-pool villas", "gated-community villas", "duplex villas"],
    buyerProfile: ["HNI buyers", "weekend-home seekers", "premium investors"],
  },
  godown: {
    singular: ["a godown", "a warehouse", "an industrial shed", "a storage facility"],
    plural: ["godowns", "warehouses", "industrial sheds", "storage units"],
    longTail: ["dock-leveller warehouses", "high-ceiling godowns", "FMCG-grade storage", "cold-storage sheds"],
    buyerProfile: ["distributors", "e-commerce 3PL operators", "small manufacturers", "wholesale traders"],
  },
  shop: {
    singular: ["a shop", "a retail space", "a showroom unit", "a commercial shop"],
    plural: ["shops", "retail spaces", "showrooms", "high-street units"],
    longTail: ["high-street shops", "ground-floor retail", "anchor-tenant ready showrooms", "mall-front shops"],
    buyerProfile: ["retail brands", "franchisees", "first-generation entrepreneurs", "F&B operators"],
  },
  office: {
    singular: ["an office", "an office space", "a commercial floor", "a workspace"],
    plural: ["office spaces", "commercial floors", "co-working ready offices", "fitted-out offices"],
    longTail: ["fitted-out offices", "Grade-A commercial space", "managed offices", "warm-shell offices"],
    buyerProfile: ["growing startups", "service-sector firms", "GCCs", "freelance professionals"],
  },
  pg: {
    singular: ["a PG", "a paying-guest accommodation", "a hostel room", "a shared room"],
    plural: ["PGs", "paying-guest accommodations", "hostel rooms", "co-living units"],
    longTail: ["girls' PGs", "boys' hostels", "professional PGs", "premium co-living"],
    buyerProfile: ["students", "young working professionals", "interns", "people relocating"],
  },
};

// ─────────────────────────────────────────────────────────────
// Sentence templates — varied openings for the same content slot
// ─────────────────────────────────────────────────────────────

/** Pick one variant deterministically by hash of the slug. */
export function pickByHash<T>(arr: readonly T[], slug: string, salt = ""): T {
  let h = 0;
  const s = slug + "|" + salt;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return arr[Math.abs(h) % arr.length];
}

/** Opening sentences for the city intro paragraph — 8 variants. */
export const CITY_INTRO_OPENERS = [
  (city: string) => `${city} sits among the more interesting real-estate markets in its region, and demand here has held up better than most analysts predicted.`,
  (city: string) => `If you have been tracking property in ${city} for any length of time, you already know the market moves in ways that catch newcomers off-guard.`,
  (city: string) => `${city} has quietly become a place where serious property buyers spend real research time before signing anything.`,
  (city: string) => `Anyone shortlisting locations in ${city} runs into the same first question: where is the value actually sitting right now?`,
  (city: string) => `What makes the ${city} property market worth a second look is the mix of older settlements and newer growth corridors that share the same pin code.`,
  (city: string) => `${city} is one of those markets where headline numbers and on-ground reality often disagree, which is exactly why local insight matters.`,
  (city: string) => `Walk through ${city} for a week and you'll notice the pace at which inventory turns — it is faster than the national average for cities of its size.`,
  (city: string) => `${city} deserves a careful look from anyone weighing options across this state, and the reasons go well beyond price.`,
];

/** Opening sentences for the locality intro — 8 variants. */
export const LOCALITY_INTRO_OPENERS = [
  (loc: string, city: string) => `${loc} is one of the more talked-about pockets inside ${city}, and the conversation has shifted noticeably over the last few quarters.`,
  (loc: string, city: string) => `Among the neighbourhoods that show up most often in ${city} search queries, ${loc} sits near the top — for reasons worth unpacking.`,
  (loc: string, city: string) => `If you have been comparing localities in ${city}, ${loc} probably crossed your shortlist at some point.`,
  (loc: string, city: string) => `${loc} has a character of its own within ${city}, shaped by the way the area grew up around its main arterial roads.`,
  (loc: string, city: string) => `Locals in ${city} treat ${loc} as one of the reliable bets — and the data on listings and time-to-sale broadly backs that view.`,
  (loc: string, city: string) => `Spend an afternoon walking through ${loc} in ${city} and the trade-offs become clear: better connectivity in some pockets, calmer streets in others.`,
  (loc: string, city: string) => `Few neighbourhoods in ${city} get as much attention from end users and investors at the same time as ${loc}.`,
  (loc: string, city: string) => `${loc}, ${city} is a pocket where the buyer profile has shifted in the last few years — and the listing mix reflects that change.`,
];

/** Closing/CTA sentences — 6 variants. */
export const CLOSING_LINES = [
  (place: string) => `If you are weighing options in ${place} today, the best next step is to compare current verified listings against your shortlist criteria.`,
  (place: string) => `${place} rewards buyers who do a little homework before booking site visits — and that homework starts with looking at real, recent listings.`,
  (place: string) => `Before you finalise anything in ${place}, take a moment to compare what verified sellers are actually listing right now.`,
  (place: string) => `The right ${place} property usually comes down to matching the pocket to the buyer, and the listings below are filtered to help you do exactly that.`,
  (place: string) => `Browse the current ${place} catalogue, save a few options, and request site visits at your own pace — there is no rush in a market like this.`,
  (place: string) => `Whether you are in the market today or a quarter from now, having a feel for ${place} pricing helps you move fast when the right listing appears.`,
];

// ─────────────────────────────────────────────────────────────
// FAQ banks — kind × intent specific. Each entry has 3+ phrasings.
// ─────────────────────────────────────────────────────────────

export interface FAQ { q: string; a: string }

export function faqsFor(
  kindSlug: PropertyKindSlug,
  intentSlug: PropertyIntentSlug,
  place: string,
  slug: string,
): FAQ[] {
  const kind = KIND_PHRASES[kindSlug];
  const plural = pickByHash(kind.plural, slug, "kp");
  const singular = pickByHash(kind.singular, slug, "ks");
  const isBuy = intentSlug === "buy";

  const out: FAQ[] = [];

  if (isBuy) {
    out.push({
      q: `What is the average price of ${plural} in ${place} right now?`,
      a: `Pricing in ${place} varies sharply by sub-pocket, road frontage and developer track record. The most reliable way to read the market is to compare verified listings on AapKaPlot — the platform shows actual asking prices, not aggregated estimates, so you see what sellers are quoting today and not a quarter-old average.`,
    });
    out.push({
      q: `Is it a good time to buy ${plural} in ${place}?`,
      a: `Timing depends more on the specific pocket than on the broader market. Some sub-locations of ${place} have absorbed inventory faster than others over the last few quarters. Look at the supply count, days-on-market and price-per-sqft trend for your shortlist before deciding.`,
    });
    out.push({
      q: `What documents should I verify before buying ${singular} in ${place}?`,
      a: `Check the title chain (preferably 30 years), municipal approval / RERA registration where applicable, encumbrance certificate, property-tax receipts, and the seller's identity proofs. For plots, also verify zoning and the master-plan land-use classification.`,
    });
  } else {
    out.push({
      q: `How much rent should I expect to pay for ${plural} in ${place}?`,
      a: `Rents in ${place} depend on furnishing, age of the building and exact pocket. The catalogue below shows current asking rents from verified owners and brokers, which is a better signal than any portal "average" you'll find elsewhere.`,
    });
    out.push({
      q: `Are pet-friendly ${plural} available for rent in ${place}?`,
      a: `A meaningful share of listings in ${place} explicitly mention pet-friendliness, but it varies by society. Filter for pet-friendly listings or ask the owner directly during the site visit — many are open to it with a small additional deposit.`,
    });
    out.push({
      q: `What is the typical security deposit for ${plural} in ${place}?`,
      a: `Deposits in ${place} typically range from one to three months of rent, though premium gated societies can ask for more. Negotiate this alongside the rent and lock-in clause before signing the agreement.`,
    });
  }

  out.push({
    q: `Who usually ${isBuy ? "buys" : "rents"} ${plural} in ${place}?`,
    a: `The buyer profile here skews towards ${pickByHash(kind.buyerProfile, slug, "bp")}. Knowing the typical occupant helps you read each listing more accurately — for example, ask why the previous tenant or owner is moving on.`,
  });

  return out;
}

// ─────────────────────────────────────────────────────────────
// Title / H1 templates — 6 variants per (kind × intent)
// ─────────────────────────────────────────────────────────────

export function pageTitle(
  kindSlug: PropertyKindSlug,
  intentSlug: PropertyIntentSlug,
  place: string,
  slug: string,
): string {
  const kind = KIND_PHRASES[kindSlug];
  const plural = pickByHash(kind.plural, slug, "title-kp");
  const isBuy = intentSlug === "buy";
  const verb = isBuy ? pickByHash(BUY_VERBS, slug, "title-v") : pickByHash(RENT_VERBS, slug, "title-v");

  const templates = isBuy
    ? [
        `${plural} for sale in ${place} — verified listings on AapKaPlot`,
        `${place}: ${plural} on sale this month`,
        `${plural} in ${place} — ${verb} with confidence`,
        `Current ${plural} on sale in ${place}`,
        `${place} ${plural} — every listing site-verified`,
        `Looking to ${verb} a ${kind.singular[0].replace(/^(an?|the) /, "")} in ${place}?`,
      ]
    : [
        `${plural} for rent in ${place} — verified by AapKaPlot`,
        `${place}: ${plural} available on rent now`,
        `Rent ${plural} in ${place} — owner-listed catalogue`,
        `${place} ${plural} on rent — fresh listings`,
        `Affordable ${plural} for rent in ${place}`,
        `Looking to ${verb} a ${kind.singular[0].replace(/^(an?|the) /, "")} in ${place}?`,
      ];

  return pickByHash(templates, slug, "title-tpl");
}
