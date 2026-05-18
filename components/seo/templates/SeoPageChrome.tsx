/**
 * SeoPageChrome — the brand-prominent strip that sits at the top of every
 * programmatic SEO page (per [[seo-content-rules]]).
 *
 * Visible elements:
 *   • AapKaPlot logo + name (links to /)
 *   • Breadcrumb (Home › City › Locality)
 *   • Hero — picsum image / gradient / pattern depending on the theme
 *   • Marketing block (composer's "why AapKaPlot" paragraphs)
 *   • Home + Browse Properties CTAs
 *
 * The chrome shows a different visual every page through the colour palette
 * picker, so adjacent slugs never look identical even when they share a
 * template variant.
 */

import Link from "next/link";
import type { ComposedBlock } from "@/lib/seo/content-composer";
import type { GeoEntry } from "@/lib/seo/geo-dataset";
import type { PageTheme } from "@/lib/seo/page-theme";
import { ACCENT_CLASSES, HEADING_CLASSES, heroImageUrl } from "@/lib/seo/page-theme";

interface ChromeProps {
  slug: string;
  geo: GeoEntry;
  parentGeo?: GeoEntry;
  h1: string;
  metaDescription: string;
  marketing: ComposedBlock | undefined;
  theme: PageTheme;
}

export function SeoPageChrome({ slug, geo, parentGeo, h1, metaDescription, marketing, theme }: ChromeProps) {
  const accent = ACCENT_CLASSES[theme.accent];
  const heading = HEADING_CLASSES[theme.headingStyle];
  const hero = theme.hero;

  return (
    <section className="relative">
      {/* Hero canvas */}
      <div className="relative overflow-hidden rounded-b-[28px] sm:rounded-b-[40px]">
        {hero === "image" && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImageUrl(slug)}
              alt={`${geo.name} — AapKaPlot ${parentGeo ? "locality" : "city"} page`}
              className="h-[260px] sm:h-[340px] w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/40 to-ink-900/10" />
          </>
        )}
        {hero === "gradient" && (
          <div className={`h-[240px] sm:h-[320px] w-full bg-gradient-to-br ${accent.gradient}`} />
        )}
        {hero === "pattern" && (
          <div className="h-[240px] sm:h-[320px] w-full bg-white relative">
            <div
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
                backgroundSize: "22px 22px",
              }}
            />
            <div className={`absolute inset-0 ${accent.soft}`} />
          </div>
        )}

        {/* Top brand strip — overlaid on hero */}
        <div className="absolute inset-x-0 top-0">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link href="/" aria-label="AapKaPlot home" className="group inline-flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-ink-900 shadow-glow transition-transform group-hover:rotate-[-4deg]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 11.5L12 3l9 8.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className={`text-[22px] font-bold tracking-tight ${hero === "image" ? "text-white" : "text-ink-900"}`}>
                AapKaPlot
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/" className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${hero === "image" ? "bg-white/95 text-ink-900 ring-white/40 hover:bg-white" : `bg-white ${accent.text} ${accent.ring}`}`}>
                ← Home
              </Link>
              <Link href="/search" className={`rounded-full px-3 py-1.5 text-sm font-semibold ${hero === "image" ? "bg-ink-900/80 text-white ring-1 ring-white/30 hover:bg-ink-900" : `${accent.bg} text-white hover:brightness-[1.05]`}`}>
                Browse Properties
              </Link>
            </div>
          </div>
        </div>

        {/* H1 + breadcrumb — overlaid on hero */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-6 sm:pb-8">
            <nav aria-label="Breadcrumb" className={`text-[12px] font-medium uppercase tracking-widest ${hero === "image" ? "text-white/85" : accent.text}`}>
              <Link href="/" className="hover:underline">AapKaPlot</Link>
              <span className="mx-2 opacity-60">›</span>
              {parentGeo ? (
                <>
                  <Link href={`/in/${parentGeo.slug}`} className="hover:underline">{parentGeo.name}</Link>
                  <span className="mx-2 opacity-60">›</span>
                </>
              ) : null}
              <span className="opacity-90">{geo.name}</span>
            </nav>
            <h1 className={`mt-2 max-w-3xl text-3xl sm:text-4xl lg:text-5xl ${heading} ${hero === "image" ? "text-white" : "text-ink-900"} leading-[1.1]`}>
              {h1}
            </h1>
            <p className={`mt-3 max-w-2xl text-sm sm:text-[15px] leading-relaxed ${hero === "image" ? "text-white/90" : "text-ink-700"}`}>
              {metaDescription}
            </p>
            <div className="sm:hidden mt-4 flex flex-wrap gap-2">
              <Link href="/" className="rounded-full bg-white/95 text-ink-900 px-3 py-1.5 text-sm font-semibold">← Home</Link>
              <Link href="/search" className="rounded-full bg-ink-900/80 text-white px-3 py-1.5 text-sm font-semibold ring-1 ring-white/30">Browse Properties</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Marketing block — sits just below the hero, slightly overlapping */}
      {marketing && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-4 sm:-mt-6 relative z-10">
          <div className={`rounded-2xl bg-white ring-1 ${accent.ring} p-5 sm:p-6 shadow-lift`}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className={`text-xs font-semibold uppercase tracking-widest ${accent.text}`}>
                Why AapKaPlot
              </p>
              <Link
                href="/about"
                className={`text-xs font-semibold ${accent.text} hover:underline`}
              >
                Learn more about us →
              </Link>
            </div>
            <div className="mt-3 space-y-3">
              {marketing.paragraphs.map((p, i) => (
                <p key={i} className="text-[14.5px] leading-relaxed text-ink-700">{p}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
