/* Visually distinct: vertical-timeline narrative, investor lens. */
import Link from "next/link";
import type { SeoTemplateProps } from "./types";
import { SeoPageChrome } from "./SeoPageChrome";
import { ACCENT_CLASSES } from "@/lib/seo/page-theme";

export default function InvestmentOutlookTemplate({
  page, geo, parentGeo, slug, theme, relatedLinks, listingsSlot,
}: SeoTemplateProps) {
  const marketing = page.blocks.find((b) => b.kind === "marketing");
  const stages = page.blocks.filter((b) => b.kind !== "closing" && b.kind !== "marketing");
  const close = page.blocks.find((b) => b.kind === "closing");
  const accent = ACCENT_CLASSES[theme.accent];

  return (
    <article>
      <SeoPageChrome
        slug={slug} geo={geo} parentGeo={parentGeo}
        h1={page.h1} metaDescription={page.metaDescription}
        marketing={marketing} theme={theme}
      />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <ol className={`relative border-l-2 ${accent.ring} space-y-12 pl-6`}>
          {stages.map((b, i) => (
            <li key={i} className="relative">
              <span className={`absolute -left-[35px] top-0 flex h-7 w-7 items-center justify-center rounded-full ${accent.bg} text-white text-xs font-semibold ring-4 ring-white`}>
                {i + 1}
              </span>
              <h2 className="text-xl font-display font-semibold text-ink-900">{b.heading}</h2>
              {b.kind === "faq" ? (
                <div className="mt-3 space-y-3">
                  {(b.data?.faqs as { q: string; a: string }[] | undefined)?.map((f, j) => (
                    <div key={j} className={`rounded-xl bg-white ring-1 ${accent.ring} p-4`}>
                      <p className="font-medium text-ink-900">{f.q}</p>
                      <p className="mt-1.5 text-ink-700 text-sm leading-relaxed">{f.a}</p>
                    </div>
                  ))}
                </div>
              ) : (
                b.paragraphs.map((p, j) => (
                  <p key={j} className="mt-3 text-ink-700 leading-relaxed">{p}</p>
                ))
              )}
              {b.kind === "listings" && listingsSlot && (
                <div className={`mt-4 rounded-2xl bg-white ring-1 ${accent.ring} p-4`}>{listingsSlot}</div>
              )}
            </li>
          ))}
        </ol>

        {close && (
          <div className={`mt-12 rounded-3xl ${accent.bg} text-white px-8 py-10`}>
            <h2 className="text-2xl font-display font-semibold">{close.heading}</h2>
            {close.paragraphs.map((p, i) => <p key={i} className="mt-3 leading-relaxed opacity-95">{p}</p>)}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-900">← Back to AapKaPlot</Link>
              <Link href="/search" className="rounded-full bg-ink-900/30 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30">Browse Live Listings</Link>
            </div>
          </div>
        )}

        {!!relatedLinks.length && (
          <div className="mt-10">
            <p className="text-xs uppercase tracking-wider font-semibold text-ink-500">More outlooks</p>
            <ul className="mt-3 grid sm:grid-cols-2 gap-2">
              {relatedLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={`block rounded-lg bg-white ring-1 ${accent.ring} p-3 text-ink-800 hover:${accent.soft}`}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
