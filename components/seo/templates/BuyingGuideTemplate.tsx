/* Visually distinct: long-form article with sticky TOC, narrow column. */
import Link from "next/link";
import type { SeoTemplateProps } from "./types";
import { SeoPageChrome } from "./SeoPageChrome";
import { ACCENT_CLASSES } from "@/lib/seo/page-theme";

export default function BuyingGuideTemplate({
  page, geo, parentGeo, slug, theme, relatedLinks, listingsSlot,
}: SeoTemplateProps) {
  const marketing = page.blocks.find((b) => b.kind === "marketing");
  const ordered = page.blocks.filter((b) => b.kind !== "closing" && b.kind !== "marketing");
  const close = page.blocks.find((b) => b.kind === "closing");
  const accent = ACCENT_CLASSES[theme.accent];

  return (
    <article>
      <SeoPageChrome
        slug={slug} geo={geo} parentGeo={parentGeo}
        h1={page.h1} metaDescription={page.metaDescription}
        marketing={marketing} theme={theme}
      />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-14">
        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
          <nav className="lg:sticky lg:top-24 lg:self-start text-sm">
            <p className="font-semibold text-ink-900 uppercase tracking-wider text-xs">In this guide</p>
            <ol className="mt-3 space-y-2 list-decimal list-inside text-ink-600">
              {ordered.map((b, i) => (
                <li key={i}>
                  <a href={`#sec-${i}`} className={`hover:${accent.text}`}>{b.heading}</a>
                </li>
              ))}
            </ol>
            <div className={`mt-8 rounded-xl ${accent.soft} p-4 ring-1 ${accent.ring} text-ink-700`}>
              <p className={`text-xs uppercase tracking-wider ${accent.text} font-semibold`}>Reading time</p>
              <p className="mt-1 text-lg font-semibold text-ink-900">{Math.max(3, Math.round(page.wordCount / 220))} min</p>
            </div>
            <Link href="/" className="mt-6 block text-xs font-semibold text-ink-700 hover:underline">← Back to AapKaPlot</Link>
          </nav>

          <div className="prose-narrow max-w-2xl space-y-10">
            {ordered.map((b, i) => (
              <section key={i} id={`sec-${i}`}>
                <h2 className={`font-display text-2xl text-ink-900 border-b ${accent.ring} pb-2`}>
                  <span className={`${accent.text} mr-2`}>{String(i + 1).padStart(2, "0")}</span>
                  {b.heading}
                </h2>
                {b.kind === "faq"
                  ? <FaqList faqs={(b.data?.faqs as { q: string; a: string }[] | undefined) ?? []} />
                  : b.paragraphs.map((p, j) => (
                      <p key={j} className="mt-4 text-ink-700 leading-[1.8] text-[17px]">{p}</p>
                    ))}
                {b.kind === "listings" && listingsSlot && <div className="mt-5">{listingsSlot}</div>}
              </section>
            ))}

            {close && (
              <section className={`border-t-2 ${accent.ring} pt-6 italic text-ink-800`}>
                {close.paragraphs.map((p, i) => <p key={i} className="text-lg leading-relaxed">{p}</p>)}
                <Link href="/search" className={`mt-4 inline-block rounded-lg ${accent.bg} px-4 py-2 text-sm font-semibold text-white hover:brightness-105`}>
                  Browse Properties on AapKaPlot →
                </Link>
              </section>
            )}

            {!!relatedLinks.length && (
              <section className="mt-12 rounded-2xl bg-ink-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Continue reading</p>
                <ul className="mt-3 grid sm:grid-cols-2 gap-3">
                  {relatedLinks.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-ink-900 underline-offset-4 hover:underline">→ {l.label}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <dl className="mt-4 space-y-5">
      {faqs.map((f, i) => (
        <div key={i}>
          <dt className="font-semibold text-ink-900">{f.q}</dt>
          <dd className="mt-1.5 text-ink-700 leading-relaxed">{f.a}</dd>
        </div>
      ))}
    </dl>
  );
}
