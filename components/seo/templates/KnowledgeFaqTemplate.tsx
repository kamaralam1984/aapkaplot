/* Visually distinct: FAQ-led learn-mode page. Q&A first, listings after. */
import Link from "next/link";
import type { SeoTemplateProps } from "./types";
import { SeoPageChrome } from "./SeoPageChrome";
import { ACCENT_CLASSES } from "@/lib/seo/page-theme";

export default function KnowledgeFaqTemplate({
  page, geo, parentGeo, slug, theme, relatedLinks, listingsSlot,
}: SeoTemplateProps) {
  const marketing = page.blocks.find((b) => b.kind === "marketing");
  const faq = page.blocks.find((b) => b.kind === "faq");
  const intro = page.blocks.find((b) => b.kind === "intro");
  const guide = page.blocks.find((b) => b.kind === "guide");
  const price = page.blocks.find((b) => b.kind === "price");
  const amen = page.blocks.find((b) => b.kind === "amenities");
  const conn = page.blocks.find((b) => b.kind === "connectivity");
  const listings = page.blocks.find((b) => b.kind === "listings");
  const accent = ACCENT_CLASSES[theme.accent];

  const faqs = (faq?.data?.faqs as { q: string; a: string }[] | undefined) ?? [];

  return (
    <article>
      <SeoPageChrome
        slug={slug} geo={geo} parentGeo={parentGeo}
        h1={page.h1} metaDescription={page.metaDescription}
        marketing={marketing} theme={theme}
      />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-14">
        <section>
          <h2 className={`text-xs uppercase tracking-widest font-semibold ${accent.text}`}>Most asked</h2>
          <div className="mt-3 space-y-3">
            {faqs.map((f, i) => (
              <details key={i} className={`group rounded-2xl ${accent.soft} ring-1 ${accent.ring} p-5 open:bg-white open:ring-2`}>
                <summary className="cursor-pointer flex items-start justify-between gap-4">
                  <span className="font-semibold text-ink-900">{f.q}</span>
                  <span className={`${accent.text} text-xl leading-none group-open:rotate-45 transition`}>+</span>
                </summary>
                <p className="mt-3 text-ink-700 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className={`text-xs uppercase tracking-widest font-semibold ${accent.text}`}>Deep dive</h2>
          <div className="mt-4 space-y-8">
            {[intro, price, amen, conn, guide].filter(Boolean).map((b, i) => (
              <div key={i}>
                <h3 className="font-display text-xl text-ink-900">{b!.heading}</h3>
                {b!.paragraphs.map((p, j) => (
                  <p key={j} className="mt-3 text-ink-700 leading-relaxed">{p}</p>
                ))}
              </div>
            ))}
          </div>
        </section>

        {listings && (
          <section className="mt-12 rounded-3xl bg-ink-900 text-white p-6 sm:p-8">
            <h2 className="text-xl font-display font-semibold">{listings.heading}</h2>
            {listings.paragraphs.map((p, i) => <p key={i} className="mt-3 leading-relaxed text-ink-100">{p}</p>)}
            {listingsSlot && <div className="mt-5 rounded-2xl bg-white p-4 text-ink-800">{listingsSlot}</div>}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/" className="rounded-full bg-white text-ink-900 px-4 py-2 text-sm font-semibold">← AapKaPlot Home</Link>
              <Link href="/search" className="rounded-full bg-ink-700 text-white px-4 py-2 text-sm font-semibold">Browse All Listings</Link>
            </div>
          </section>
        )}

        {!!relatedLinks.length && (
          <section className="mt-10">
            <h2 className={`text-xs uppercase tracking-widest font-semibold ${accent.text}`}>Continue learning</h2>
            <ul className="mt-3 space-y-1.5">
              {relatedLinks.map((l) => (
                <li key={l.href}>→ <Link href={l.href} className={`text-ink-800 hover:${accent.text} underline-offset-2 hover:underline`}>{l.label}</Link></li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
