/**
 * Per-page visual theme — colour palette + hero image, picked
 * deterministically from the slug hash so adjacent pages look distinct
 * but the same URL always renders the same theme.
 *
 * Five palettes × six templates × varied hero images = effectively every
 * SEO page looks different from its neighbours, even if they share a
 * template variant.
 */

import { pickByHash } from "./keyword-bank";

export interface PageTheme {
  /** Tailwind color family used for accents (text, ring, gradient stops). */
  accent: "emerald" | "rose" | "indigo" | "amber" | "teal" | "violet";
  /** Background tint family for soft panels. */
  tint: "emerald" | "rose" | "indigo" | "amber" | "teal" | "violet";
  /** Heading typography variant — affects size/weight in chrome. */
  headingStyle: "display" | "tight" | "serif" | "mono";
  /** Hero presentation — image, gradient, pattern. */
  hero: "image" | "gradient" | "pattern";
}

const PALETTES: PageTheme[] = [
  { accent: "emerald", tint: "emerald", headingStyle: "display", hero: "image" },
  { accent: "rose",    tint: "rose",    headingStyle: "serif",   hero: "gradient" },
  { accent: "indigo",  tint: "indigo",  headingStyle: "tight",   hero: "image" },
  { accent: "amber",   tint: "amber",   headingStyle: "mono",    hero: "pattern" },
  { accent: "teal",    tint: "teal",    headingStyle: "display", hero: "gradient" },
  { accent: "violet",  tint: "violet",  headingStyle: "tight",   hero: "image" },
  { accent: "indigo",  tint: "amber",   headingStyle: "serif",   hero: "pattern" },
  { accent: "emerald", tint: "teal",    headingStyle: "mono",    hero: "gradient" },
];

export function pickPageTheme(slug: string): PageTheme {
  return pickByHash(PALETTES, slug, "theme");
}

/** Lorem Picsum URL — free, deterministic, no API key. Slug as seed
 *  guarantees the same image renders for the same URL forever. */
export function heroImageUrl(slug: string, w = 1600, h = 520): string {
  const seed = slug.replace(/[^a-z0-9-]/gi, "-");
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

/** Tailwind class helpers — keeps the JIT-friendly literal classes co-located. */
export const ACCENT_CLASSES: Record<PageTheme["accent"], {
  text: string; bg: string; ring: string; gradient: string; soft: string;
}> = {
  emerald: { text: "text-emerald-700", bg: "bg-emerald-600", ring: "ring-emerald-200", gradient: "from-emerald-100 via-emerald-50 to-white", soft: "bg-emerald-50/40" },
  rose:    { text: "text-rose-700",    bg: "bg-rose-600",    ring: "ring-rose-200",    gradient: "from-rose-100 via-rose-50 to-white",       soft: "bg-rose-50/40" },
  indigo:  { text: "text-indigo-700",  bg: "bg-indigo-600",  ring: "ring-indigo-200",  gradient: "from-indigo-100 via-indigo-50 to-white",   soft: "bg-indigo-50/40" },
  amber:   { text: "text-amber-800",   bg: "bg-amber-600",   ring: "ring-amber-200",   gradient: "from-amber-100 via-amber-50 to-white",     soft: "bg-amber-50/40" },
  teal:    { text: "text-teal-700",    bg: "bg-teal-600",    ring: "ring-teal-200",    gradient: "from-teal-100 via-teal-50 to-white",       soft: "bg-teal-50/40" },
  violet:  { text: "text-violet-700",  bg: "bg-violet-600",  ring: "ring-violet-200",  gradient: "from-violet-100 via-violet-50 to-white",   soft: "bg-violet-50/40" },
};

export const HEADING_CLASSES: Record<PageTheme["headingStyle"], string> = {
  display: "font-display font-semibold tracking-tight",
  tight:   "font-semibold tracking-tighter",
  serif:   "font-serif font-bold",
  mono:    "font-mono font-bold uppercase tracking-wider text-[0.92em]",
};
