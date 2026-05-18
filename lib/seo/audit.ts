/**
 * Slug Quality Audit — detect spammy slug patterns that Google would
 * penalise, and tag them on the SeoPage row.
 *
 * The audit only flags. The admin then chooses to demote (move to
 * ARCHIVED) or delete via the bulk "Clean Bad Slugs" button.
 *
 * Patterns detected:
 *   • TRIPLE_TOKEN  — same word ≥3 times in a row (best-best-best)
 *   • YEAR_STACK    — multiple year tokens (2020-2021-2022)
 *   • JUNK_FRAGMENT — slug contains undefined/null/error/test
 *   • DOUBLE_SLASH  — accidental "//" or stray separators
 *   • TOO_LONG      — slug > 90 chars (Google trims)
 *   • TOO_SHORT     — slug < 5 chars (low value)
 */

export type SlugFlag =
  | "TRIPLE_TOKEN"
  | "YEAR_STACK"
  | "JUNK_FRAGMENT"
  | "DOUBLE_SLASH"
  | "TOO_LONG"
  | "TOO_SHORT";

const JUNK_TOKENS = ["undefined", "null", "nan", "error", "test", "dummy", "placeholder", "lorem"];
const YEAR_RE = /\b(19|20)\d{2}\b/g;

export function auditSlug(slug: string): SlugFlag[] {
  const flags = new Set<SlugFlag>();
  const lower = slug.toLowerCase();
  const tokens = lower.split(/[\/-]/).filter(Boolean);

  // 1. Triple-token repetition (best-best-best)
  for (let i = 0; i <= tokens.length - 3; i++) {
    if (tokens[i] === tokens[i + 1] && tokens[i + 1] === tokens[i + 2]) {
      flags.add("TRIPLE_TOKEN");
      break;
    }
  }

  // 2. Year stacking
  const years = lower.match(YEAR_RE);
  if (years && years.length >= 2) flags.add("YEAR_STACK");

  // 3. Junk fragments
  if (JUNK_TOKENS.some((j) => tokens.includes(j))) flags.add("JUNK_FRAGMENT");

  // 4. Stray separators
  if (/\/\//.test(slug) || /--/.test(slug) || /-\//.test(slug) || /\/-/.test(slug)) {
    flags.add("DOUBLE_SLASH");
  }

  // 5. Length sanity
  if (slug.length > 90) flags.add("TOO_LONG");
  if (slug.replace("/", "").length < 5) flags.add("TOO_SHORT");

  return Array.from(flags);
}

export function flagLabel(f: SlugFlag): string {
  switch (f) {
    case "TRIPLE_TOKEN":  return "Repeated word";
    case "YEAR_STACK":    return "Year stack";
    case "JUNK_FRAGMENT": return "Junk token";
    case "DOUBLE_SLASH":  return "Stray separator";
    case "TOO_LONG":      return "Too long";
    case "TOO_SHORT":     return "Too short";
  }
}
