/* Visually distinct: two-column split, this place vs parent geo. */
import Link from "next/link";
import type { SeoTemplateProps } from "./types";

export default function ComparisonTemplate({
  page, geo, parentGeo, relatedLinks, listingsSlot,
}: SeoTemplateProps) {
  const compareTo = parentGeo?.name ?? "broader city";
  const intro = page.blocks.find((b) => b.kind === "intro");
  const price = page.blocks.find((b) => b.kind === "price");
  const amen = page.blocks.find((b) => b.kind === "amenities");
  const guide = page.blocks.find((b) => b.kind === "guide");
  const conn = page.blocks.find((b) => b.kind === "connectivity");
  const faq = page.blocks.find((b) => b.kind === "faq");

  return (
    <article className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <header className="text-center max-w-3xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-600">Side-by-side</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-ink-900">{page.h1}</h1>
        <p className="mt-3 text-ink-700">{page.metaDescription}</p>
      </header>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <SideColumn title={geo.name} accent="rose" block={intro} />
        <SideColumn title={compareTo} accent="slate" block={intro} fallback={`Compared with the wider ${compareTo} market.`} />
      </div>

      <div className="mt-10 space-y-8">
        {price && <FullBlock block={price} accent="rose" />}
        {amen && <FullBlock block={amen} />}
        {conn && <FullBlock block={conn} />}
        {guide && <FullBlock block={guide} />}
        <div className="rounded-2xl bg-white ring-1 ring-black/5 p-6">
          <h2 className="text-xl font-semibold text-ink-900">Verified listings</h2>
          {listingsSlot}
        </div>
        {faq && <FaqGrid block={faq} />}
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
    </article>
  );
}

function SideColumn({
  title, accent, block, fallback,
}: { title: string; accent: "rose" | "slate"; block?: { heading: string; paragraphs: string[] }; fallback?: string }) {
  const ring = accent === "rose" ? "ring-rose-200 bg-rose-50/40" : "ring-slate-200 bg-slate-50/40";
  return (
    <div className={`rounded-3xl ring-1 p-6 ${ring}`}>
      <p className="text-xs uppercase tracking-widest font-semibold text-ink-500">{title}</p>
      <h3 className="mt-1 text-2xl font-display font-semibold text-ink-900">{block?.heading ?? title}</h3>
      <div className="mt-3 space-y-3 text-ink-700">
        {(block?.paragraphs ?? [fallback ?? ""]).map((p, i) => p && <p key={i} className="leading-relaxed">{p}</p>)}
      </div>
    </div>
  );
}

function FullBlock({ block, accent }: { block: { heading: string; paragraphs: string[] }; accent?: "rose" }) {
  return (
    <section className={accent === "rose" ? "rounded-2xl bg-rose-50/40 p-6 ring-1 ring-rose-100" : "rounded-2xl bg-white p-6 ring-1 ring-black/5"}>
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
