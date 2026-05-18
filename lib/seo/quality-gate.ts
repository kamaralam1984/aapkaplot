/**
 * Quality gate for programmatic-SEO pages.
 *
 * Per [[seo-content-rules]] every page must score ≥70 before it's
 * persisted or surfaced. The gate is a deliberate anti-spam moat:
 * if real data is thin, the page is rejected — Google would rather
 * see no page than a thin one.
 *
 * Score is out of 100:
 *   • 30 — word count (≥800 full marks)
 *   • 20 — number of real data sources backing the page
 *   • 20 — keyword diversity (unique tokens / total tokens)
 *   • 15 — no keyword stuffing (no token > 4% of body)
 *   • 15 — structural completeness (≥6 of 8 blocks populated)
 */

import type { ComposedPage } from "./content-composer";

export interface QualityReport {
  score: number;
  passes: boolean;
  wordCount: number;
  uniqueTokenRatio: number;
  maxTokenDensity: number;
  populatedBlocks: number;
  sources: string[];
  reasons: string[];
}

const STOPWORDS = new Set([
  "the","a","an","and","or","of","to","in","on","at","for","with","is","are","was","were","be","by","as","it","this","that","these","those","you","your","they","their","its","but","not","if","so","can","will","just","more","than","also","from","one","two","into","over","up","down","out","about","like","other","some","most","all","any","when","where","what","how","do","does","did","has","have","had","i","we","our","ours","my","mine","me",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

export function gradePage(page: ComposedPage): QualityReport {
  const reasons: string[] = [];

  const fullBody = page.blocks
    .flatMap((b) => [b.heading, ...b.paragraphs])
    .join(" ");

  const tokens = tokenize(fullBody);
  const total = tokens.length || 1;

  // Token density (max share of body taken by a single non-stopword token).
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  let maxCount = 0;
  for (const c of freq.values()) if (c > maxCount) maxCount = c;
  const maxTokenDensity = maxCount / total;
  const uniqueTokenRatio = freq.size / total;

  const populatedBlocks = page.blocks.filter(
    (b) => b.paragraphs.length > 0 && b.paragraphs.some((p) => p.trim().length > 40),
  ).length;

  // ── Scoring ────────────────────────────────────────────────
  let wordScore = Math.min(30, Math.round((page.wordCount / 800) * 30));
  if (page.wordCount < 800) reasons.push(`Word count ${page.wordCount} < 800 minimum.`);

  let sourceScore = Math.min(20, page.sources.length * 7);
  if (page.sources.length < 2) reasons.push("Only one data source backs this page.");

  let diversityScore = Math.round(Math.min(uniqueTokenRatio, 0.55) * (20 / 0.55));
  if (uniqueTokenRatio < 0.3) reasons.push(`Low keyword diversity (${(uniqueTokenRatio * 100).toFixed(0)}%).`);

  let stuffingScore = 15;
  if (maxTokenDensity > 0.04) {
    stuffingScore = Math.max(0, 15 - Math.round((maxTokenDensity - 0.04) * 300));
    reasons.push(`Highest-frequency token used ${(maxTokenDensity * 100).toFixed(1)}% of body — looks like stuffing.`);
  }

  let structureScore = Math.round((populatedBlocks / 8) * 15);
  if (populatedBlocks < 6) reasons.push(`Only ${populatedBlocks}/8 content blocks populated.`);

  const score = wordScore + sourceScore + diversityScore + stuffingScore + structureScore;

  return {
    score,
    passes: score >= 70 && page.wordCount >= 800 && populatedBlocks >= 6,
    wordCount: page.wordCount,
    uniqueTokenRatio,
    maxTokenDensity,
    populatedBlocks,
    sources: page.sources,
    reasons,
  };
}
