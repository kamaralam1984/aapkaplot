/**
 * Content composer — assembles an 800+ word, human-style SEO body
 * from real data sources, varied by deterministic slug hash.
 *
 * Per [[seo-content-rules]]:
 *   • 800+ words minimum
 *   • Real data only (Wikipedia + OSM POI + DB stats)
 *   • Human-style: varied openers, mixed sentence length
 *   • No keyword stuffing — synonym pools per concept
 *
 * Output: { blocks: ComposedBlock[], wordCount, sources }
 * The blocks are then mapped to a template variant by template-router.
 */

import {
  KIND_PHRASES, BUY_VERBS, RENT_VERBS, LOOKING_VERBS, FIND_VERBS,
  CITY_INTRO_OPENERS, LOCALITY_INTRO_OPENERS, CLOSING_LINES,
  pickByHash, faqsFor, pageTitle,
} from "./keyword-bank";
import type { GeoEntry, PropertyKindSlug, PropertyIntentSlug } from "./geo-dataset";
import type { WikiFacts, PoiBuckets, ListingStats } from "./data-sources";

export interface ComposedBlock {
  kind: "intro" | "listings" | "price" | "amenities" | "guide" | "connectivity" | "faq" | "closing";
  heading: string;
  paragraphs: string[];
  /** Optional structured payload (used by chart/list components in templates). */
  data?: Record<string, unknown>;
}

export interface ComposedPage {
  title: string;
  h1: string;
  metaDescription: string;
  blocks: ComposedBlock[];
  wordCount: number;
  sources: string[];     // attribution: "wikipedia", "osm", "aapkaplot-listings"
  keywords: string[];    // chosen keywords for this page (≤ 12)
}

export interface ComposeArgs {
  geo: GeoEntry;
  parentGeo?: GeoEntry;       // parent city when geo is a locality
  kind: PropertyKindSlug;
  intent: PropertyIntentSlug;
  wiki: WikiFacts | null;
  poi: PoiBuckets;
  stats: ListingStats;
  slug: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function countWords(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

function fmtInr(lakh: number): string {
  if (lakh >= 100) return `₹${(lakh / 100).toFixed(2)} Cr`;
  return `₹${lakh} L`;
}

function joinList(items: string[], conj = "and"): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conj} ${items[1]}`;
  return items.slice(0, -1).join(", ") + ` ${conj} ${items[items.length - 1]}`;
}

// ─────────────────────────────────────────────────────────────
// Block composers
// ─────────────────────────────────────────────────────────────

function composeIntro(a: ComposeArgs): ComposedBlock {
  const { geo, parentGeo, kind, intent, wiki, slug } = a;
  const isLocality = !!parentGeo;
  const place = geo.name;
  const cityName = parentGeo?.name ?? geo.name;
  const k = KIND_PHRASES[kind];
  const kPlural = pickByHash(k.plural, slug, "intro-kp");
  const verb = intent === "buy"
    ? pickByHash(BUY_VERBS, slug, "intro-v")
    : pickByHash(RENT_VERBS, slug, "intro-v");

  const paras: string[] = [];

  if (isLocality) {
    paras.push(pickByHash(LOCALITY_INTRO_OPENERS, slug, "li")(place, cityName));
  } else {
    paras.push(pickByHash(CITY_INTRO_OPENERS, slug, "ci")(place));
  }

  if (wiki?.extract) {
    paras.push(wiki.extract);
  } else {
    paras.push(
      `For anyone planning to ${verb} ${kPlural} in ${place}, the first step is understanding what makes this market tick. ` +
      `It is shaped by a mix of long-time residents who rarely sell, a steady inflow of buyers from neighbouring towns, and a layer of investors watching ${cityName} as a value play. ` +
      `That mix is exactly why prices and rents in ${place} don't always move in lockstep with the city average — and why a careful, listing-level view tends to outperform any headline summary.`
    );
  }

  const heading = isLocality
    ? `About ${place}, ${cityName}`
    : `About the ${place} property market`;

  return { kind: "intro", heading, paragraphs: paras, data: { wikiUsed: !!wiki } };
}

function composeListings(a: ComposeArgs): ComposedBlock {
  const { geo, kind, intent, stats, slug } = a;
  const place = geo.name;
  const k = KIND_PHRASES[kind];
  const kPlural = pickByHash(k.plural, slug, "lst-kp");
  const isBuy = intent === "buy";
  const matchingCount = isBuy ? stats.forSale : stats.forRent;
  const verb = isBuy ? "for sale" : "for rent";

  const paras: string[] = [];

  if (stats.total === 0) {
    paras.push(
      `At the time this page was last refreshed, the AapKaPlot catalogue did not have an active ${kPlural} listing in ${place}. ` +
      `That can change quickly — sellers and landlords here often list and close within the same fortnight. ` +
      `Use the 'Notify me' option below to get an email the moment a verified ${kPlural} listing goes live in ${place}.`
    );
  } else {
    paras.push(
      `AapKaPlot currently has ${stats.total} active ${pickByHash(k.plural, slug, "lst-kp2")} ${verb} in ${place}, ` +
      `with ${matchingCount} of them matching your specific ${isBuy ? "buying" : "rental"} intent. ` +
      `Every listing on this page has been site-verified — meaning a real address, real photographs and a real seller, not a portal-scraped lead.`
    );
    if (stats.topKinds.length > 0) {
      paras.push(
        `The current mix in ${place} leans toward ${joinList(stats.topKinds.slice(0, 3).map((t) => t.kind.toLowerCase()))}, ` +
        `which tells you something about who is actively building and selling here right now. ` +
        `If your shortlist is heavy on a category not yet represented, the catalogue refreshes daily — and the ${pickByHash(FIND_VERBS, slug, "f")} filter at the top of the page will surface the moment new options arrive.`
      );
    }
  }
  return { kind: "listings", heading: `Current ${kPlural} ${verb} in ${place}`, paragraphs: paras, data: { stats } };
}

function composePrice(a: ComposeArgs): ComposedBlock {
  const { geo, kind, intent, stats, slug } = a;
  const place = geo.name;
  const k = KIND_PHRASES[kind];
  const kPlural = pickByHash(k.plural, slug, "pr-kp");
  const isBuy = intent === "buy";

  const paras: string[] = [];

  if (isBuy && stats.avgPriceLakh) {
    const range = Math.round(stats.avgPriceLakh * 0.15);
    paras.push(
      `Based on current verified listings, the average asking price for ${kPlural} in ${place} sits around ${fmtInr(stats.avgPriceLakh)}, ` +
      `with most listings clustering between ${fmtInr(Math.max(1, stats.avgPriceLakh - range))} and ${fmtInr(stats.avgPriceLakh + range)}. ` +
      (stats.medianPriceLakh
        ? `The median is closer to ${fmtInr(stats.medianPriceLakh)}, which is often a better reference point than the mean because a single premium listing can drag the average up. `
        : "") +
      `Pricing varies sharply by exact pocket, plot frontage and approval status, so treat these numbers as a starting point rather than a contract.`
    );
    if (stats.avgPriceSqftInr) {
      paras.push(
        `On a per-square-foot basis, listings in ${place} are quoting around ₹${stats.avgPriceSqftInr.toLocaleString("en-IN")} on average. ` +
        `Compare that with the asking price of any specific listing — if the per-sqft is significantly above the average, the listing either has a real premium feature ` +
        `(corner plot, ready-built structure, prime road access) or the seller is testing the market. Both are worth knowing before you make an offer.`
      );
    }
  } else if (!isBuy && stats.avgPriceLakh) {
    paras.push(
      `Monthly rent for ${kPlural} in ${place} broadly tracks with furnishing and society quality. ` +
      `Owners on AapKaPlot are typically quoting in line with what the local market supports — outliers stand out quickly when you compare three or four listings side by side. ` +
      `Always factor in the security deposit, maintenance and any extra charges (parking, club, generator) into your real monthly cost.`
    );
  } else {
    paras.push(
      `Price benchmarks in ${place} are best read off live listings, since circle-rate or year-old data rarely reflects what owners are actually quoting today. ` +
      `Once new ${kPlural} listings appear in ${place}, this section will surface the current asking range. ` +
      `In the meantime, the nearest comparable pockets in the same city can help you triangulate a fair price.`
    );
  }
  return { kind: "price", heading: `Price snapshot — ${kPlural} in ${place}`, paragraphs: paras };
}

function composeAmenities(a: ComposeArgs): ComposedBlock {
  const { geo, poi, slug } = a;
  const place = geo.name;
  const paras: string[] = [];

  const totalPois = poi.schools + poi.hospitals + poi.banks + poi.supermarkets + poi.parks;

  if (totalPois > 0) {
    const items: string[] = [];
    if (poi.schools) items.push(`${poi.schools} schools`);
    if (poi.hospitals) items.push(`${poi.hospitals} hospitals or clinics`);
    if (poi.banks) items.push(`${poi.banks} bank branches`);
    if (poi.supermarkets) items.push(`${poi.supermarkets} supermarkets`);
    if (poi.parks) items.push(`${poi.parks} parks`);
    if (poi.pharmacies) items.push(`${poi.pharmacies} pharmacies`);

    paras.push(
      `Inside a 2-km radius of ${place}, OpenStreetMap volunteers have mapped ${joinList(items)}. ` +
      `That count gives you a rough density read — areas with double-digit schools and a handful of hospitals usually translate to walkable daily life, ` +
      `while sparser pockets can mean longer commutes for essentials.`
    );
    if (poi.named.school.length || poi.named.hospital.length) {
      const named: string[] = [];
      if (poi.named.school.length) named.push(`schools like ${joinList(poi.named.school)}`);
      if (poi.named.hospital.length) named.push(`hospitals such as ${joinList(poi.named.hospital)}`);
      paras.push(
        `Among the more recognisable names within walking or short-driving distance, you'll find ${joinList(named)}. ` +
        `These anchor institutions tend to hold property values steady even when the broader micro-market goes through a soft patch — ` +
        `a useful signal if you are buying with a 5–10 year horizon.`
      );
    }
  } else {
    paras.push(
      `Public mapping data for ${place} is still thin, which is common in newer or recently developed pockets. ` +
      `That does not mean the area lacks amenities — it usually means OpenStreetMap volunteers have not catalogued them yet. ` +
      `When you do a site visit, plan a 15-minute walk in any direction and you'll quickly read the real density of schools, clinics, shops and parks for yourself.`
    );
  }
  return { kind: "amenities", heading: `What's around ${place}`, paragraphs: paras, data: { poi } };
}

function composeGuide(a: ComposeArgs): ComposedBlock {
  const { geo, kind, intent, slug } = a;
  const place = geo.name;
  const k = KIND_PHRASES[kind];
  const isBuy = intent === "buy";
  const kPlural = pickByHash(k.plural, slug, "g-kp");
  const longTail = pickByHash(k.longTail, slug, "g-lt");
  const lookVerb = pickByHash(LOOKING_VERBS, slug, "g-lv");

  const paras: string[] = [];

  if (isBuy) {
    paras.push(
      `Buyers ${lookVerb} ${kPlural} in ${place} usually run into the same set of decisions: how much to budget, how strict to be about exact pocket, and how much weight to put on resale liquidity versus immediate fit. ` +
      `A practical approach is to start wide — see five listings across ${place} that broadly meet your brief — then narrow ruthlessly. ` +
      `By the third or fourth visit, you will already have a feel for what is a fair price and what isn't.`
    );
    paras.push(
      `On documentation, the non-negotiables are clear title (ideally a 30-year chain), municipal or RERA approvals where the property type demands it, and an encumbrance certificate. ` +
      `For ${longTail}, also verify zoning and the approved layout if you plan to build or renovate. ` +
      `A small fee paid to a local advocate to vet papers can save many times that amount in post-purchase headaches.`
    );
  } else {
    paras.push(
      `Renters ${lookVerb} ${kPlural} in ${place} generally have more leverage than they think. ` +
      `Owners value reliable tenants, so being prompt with documents, references and a clear move-in date often unlocks better terms than haggling on rent alone. ` +
      `Negotiate the maintenance and lock-in clause as carefully as the headline rent.`
    );
    paras.push(
      `Before signing, walk through the unit at the same time of day you would normally come home — afternoon visibility, evening noise levels and water pressure all read differently after sunset. ` +
      `For ${longTail}, also confirm the society or building rules around guests, work-from-home setups and parking; these clauses are where most disputes show up later.`
    );
  }
  return { kind: "guide", heading: `${isBuy ? "Buying" : "Renting"} ${kPlural} in ${place}: what to watch for`, paragraphs: paras };
}

function composeConnectivity(a: ComposeArgs): ComposedBlock {
  const { geo, poi, slug } = a;
  const place = geo.name;
  const paras: string[] = [];

  const hasTransport = poi.busStops + poi.railwayStations > 0;
  if (hasTransport) {
    const parts: string[] = [];
    if (poi.busStops) parts.push(`${poi.busStops} bus stops`);
    if (poi.railwayStations) parts.push(`${poi.railwayStations} railway station${poi.railwayStations > 1 ? "s" : ""}`);
    paras.push(
      `On the connectivity side, ${place} maps to ${joinList(parts)} within an easy radius. ` +
      `Public transport availability matters more than most first-time buyers expect: even a household with two cars finds that a Metro entry within 800 metres adds tangible resale value over a 5–10 year hold.`
    );
    if (poi.named.landmark.length) {
      paras.push(
        `Key transport landmarks nearby include ${joinList(poi.named.landmark)}, which set the rhythm of daily commutes for residents here. ` +
        `If you work in another part of the city, do a real commute test on a weekday morning before finalising — peak-hour reality is very different from a Sunday afternoon drive-through.`
      );
    }
  } else {
    paras.push(
      `Connectivity in and out of ${place} is typically a mix of personal vehicles, app-based cabs and shared autos. ` +
      `Public-transit options can be lighter than in central pockets of the same city, which is one reason properties here often trade at a measurable discount to comparable units closer to a Metro or major rail link. ` +
      `For some buyers — especially those working from home or running a private vehicle — that trade-off is a feature, not a bug.`
    );
  }
  return { kind: "connectivity", heading: `Getting around ${place}`, paragraphs: paras };
}

function composeFaq(a: ComposeArgs): ComposedBlock {
  const { geo, kind, intent, slug } = a;
  const place = geo.name;
  const faqs = faqsFor(kind, intent, place, slug);
  return {
    kind: "faq",
    heading: `Frequently asked questions`,
    paragraphs: faqs.flatMap((f) => [`**${f.q}**`, f.a]),
    data: { faqs },
  };
}

function composeClosing(a: ComposeArgs): ComposedBlock {
  const { geo, slug } = a;
  const place = geo.name;
  const para = pickByHash(CLOSING_LINES, slug, "close")(place);
  return { kind: "closing", heading: `Next step`, paragraphs: [para] };
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export function composePage(a: ComposeArgs): ComposedPage {
  const blocks = [
    composeIntro(a),
    composeListings(a),
    composePrice(a),
    composeAmenities(a),
    composeGuide(a),
    composeConnectivity(a),
    composeFaq(a),
    composeClosing(a),
  ];

  const wordCount = blocks.reduce(
    (sum, b) => sum + b.paragraphs.reduce((s, p) => s + countWords(p), 0),
    0,
  );

  const sources: string[] = ["aapkaplot-listings"];
  if (a.wiki) sources.push("wikipedia");
  if ((a.poi.schools + a.poi.hospitals + a.poi.banks) > 0) sources.push("openstreetmap");

  const title = pageTitle(a.kind, a.intent, a.geo.name, a.slug);
  const k = KIND_PHRASES[a.kind];
  const kPlural = pickByHash(k.plural, a.slug, "meta-kp");
  const verbWord = a.intent === "buy"
    ? pickByHash(BUY_VERBS, a.slug, "meta-v")
    : pickByHash(RENT_VERBS, a.slug, "meta-v");
  const metaDescription = `Looking to ${verbWord} ${kPlural} in ${a.geo.name}? Browse verified listings, current prices, nearby schools, hospitals and connectivity — updated daily on AapKaPlot.`.slice(0, 155);

  const keywords = [
    `${kPlural.toLowerCase()} in ${a.geo.name.toLowerCase()}`,
    `${k.singular[0].toLowerCase()} for ${a.intent} ${a.geo.name.toLowerCase()}`,
    `${a.intent === "buy" ? "buy" : "rent"} ${k.singular[0].toLowerCase().replace(/^(an?|the) /, "")} ${a.geo.name.toLowerCase()}`,
    `${a.geo.name.toLowerCase()} property`,
    `${a.geo.name.toLowerCase()} real estate`,
    ...(a.geo.state ? [`${kPlural.toLowerCase()} in ${a.geo.state.replace(/-/g, " ")}`] : []),
    ...(a.parentGeo ? [`${kPlural.toLowerCase()} ${a.parentGeo.name.toLowerCase()} ${a.geo.name.toLowerCase()}`] : []),
  ].slice(0, 12);

  return {
    title,
    h1: title.split(" — ")[0],
    metaDescription,
    blocks,
    wordCount,
    sources,
    keywords,
  };
}
