/* Visually distinct: two-column split, this place vs parent geo. */
import Link from "next/link";
import type { SeoTemplateProps } from "./types";
import { SeoPageChrome } from "./SeoPageChrome";
import { ACCENT_CLASSES } from "@/lib/seo/page-theme";

export default function ComparisonTemplate({
  page, geo, parentGeo, slug, theme, relatedLinks, listingsSlot,
}: SeoTemplateProps) {
  const marketing = page.blocks.find((b) => b.kind === "marketing");
  const compareTo = parentGeo?.name ?? "broader city";
  const intro = page.blocks.find((b) => b.kind === "intro");
  const price = page.blocks.find((b) => b.kind === "price");
  const amen = page.blocks.find((b) => b.kind === "amenities");
  const guide = page.blocks.find((b) => b.kind === "guide");
  const conn = page.blocks.find((b) => b.kind === "connectivity");
  const faq = page.blocks.find((b) => b.kind === "faq");
  const accent = ACCENT_CLASSES[theme.accent];

  return (
    <article>
      <SeoPageChrome
        slug={slug} geo={geo} parentGeo={parentGeo}
        h1={page.h1} metaDescription={page.metaDescription}
        marketing={marketing} theme={theme}
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className={`text-xs font-semibold uppercase tracking-widest ${accent.text} text-center`}>Side-by-side comparison</p>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <SideColumn title={geo.name} block={intro} accentRing={accent.ring} accentSoft={accent.soft} />
          <SideColumn title={compareTo} block={intro} accentRing="ring-slate-200" accentSoft="bg-slate-50/40" fallback={`Compared with the wider ${compareTo} market.`} />
        </div>

        <div className="mt-10 space-y-8">
          {price && <FullBlock block={price} soft={accent.soft} ring={accent.ring} />}
          {amen && <FullBlock block={amen} />}
          {conn && <FullBlock block={conn} />}
          {guide && <FullBlock block={guide} />}
          <div className="rounded-2xl bg-white ring-1 ring-black/5 p-6">
            <h2 className="text-xl font-semibold text-ink-900">Verified listings on AapKaPlot</h2>
            {listingsSlot}
          </div>
          {faq && <FaqGrid block={faq} />}
        </div>

        <div className={`mt-12 rounded-2xl ${accent.bg} text-white px-6 py-7 text-center`}>
          <p className="text-lg">Ready to act on what you just read?</p>
          <div className="mt-3 flex justify-center gap-3">
            <Link href="/" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-900">← AapKaPlot Home</Link>
            <Link href="/search" className="rounded-full bg-ink-900/30 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30">Browse Listings</Link>
          </div>
        </div>

        {!!relatedLinks.length && (
          <section className="mt-12 border-t border-ink-200 pt-6">
            <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold">More comparisons</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedLinks.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-full bg-ink-50 hover:bg-ink-100 px-3 py-1.5 text-sm text-ink-800">
                  {l.label}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function SideColumn({ title, block, fallback, accentRing, accentSoft }: { title: string; block?: { heading: string; paragraphs: string[] }; fallback?: string; accentRing: string; accentSoft: string }) {
  return (
    <div className={`rounded-3xl ring-1 ${accentRing} ${accentSoft} p-6`}>
      <p className="text-xs uppercase tracking-widest font-semibold text-ink-500">{title}</p>
      <h3 className="mt-1 text-2xl font-display font-semibold text-ink-900">{block?.heading ?? title}</h3>
      <div className="mt-3 space-y-3 text-ink-700">
        {(block?.paragraphs ?? [fallback ?? ""]).map((p, i) => p && <p key={i} className="leading-relaxed">{p}</p>)}
      </div>
    </div>
  );
}

function FullBlock({ block, soft, ring }: { block: { heading: string; paragraphs: string[] }; soft?: string; ring?: string }) {
  const cls = soft ? `rounded-2xl ${soft} p-6 ring-1 ${ring ?? "ring-black/5"}` : "rounded-2xl bg-white p-6 ring-1 ring-black/5";
  return (
    <section className={cls}>
      <h2 className="text-xl font-semibold text-ink-900">{block.heading}</h2>
      {block.paragraphs.map((p, i) => <p key={i} className="mt-3 text-ink-700 leading-relaxed">{p}</p>)}
    </section>
  );
}

function FaqGrid({ block }: { block: { heading: string; data?: { faqs?: { q: string; a: string }[] } } }) {
  const faqs = block.data?.faqs ?? [];
  return (
    <section>
      <h2 className="text-xl font-semibold text-ink-900">{block.heading}</h2>
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        {faqs.map((f, i) => (
          <div key={i} className="rounded-xl bg-white p-5 ring-1 ring-black/5">
            <p className="font-semibold text-ink-900">{f.q}</p>
            <p className="mt-2 text-sm text-ink-700 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
