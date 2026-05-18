/* Visually distinct: hero-image overview. Wide top hero (SeoPageChrome),
   listings grid, side facts. */
import Link from "next/link";
import type { SeoTemplateProps } from "./types";
import { SeoPageChrome } from "./SeoPageChrome";
import { ACCENT_CLASSES } from "@/lib/seo/page-theme";

export default function OverviewMapTemplate({
  page, geo, parentGeo, slug, theme, relatedLinks, listingsSlot,
}: SeoTemplateProps) {
  const intro    = page.blocks.find((b) => b.kind === "intro");
  const marketing= page.blocks.find((b) => b.kind === "marketing");
  const listings = page.blocks.find((b) => b.kind === "listings");
  const price    = page.blocks.find((b) => b.kind === "price");
  const amen     = page.blocks.find((b) => b.kind === "amenities");
  const guide    = page.blocks.find((b) => b.kind === "guide");
  const conn     = page.blocks.find((b) => b.kind === "connectivity");
  const faq      = page.blocks.find((b) => b.kind === "faq");
  const close    = page.blocks.find((b) => b.kind === "closing");
  const accent = ACCENT_CLASSES[theme.accent];

  return (
    <article>
      <SeoPageChrome
        slug={slug} geo={geo} parentGeo={parentGeo}
        h1={page.h1} metaDescription={page.metaDescription}
        marketing={marketing} theme={theme}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {page.keywords.slice(0, 6).map((k) => (
            <span key={k} className={`rounded-full bg-white px-3 py-1 ring-1 ${accent.ring} ${accent.text}`}>{k}</span>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <main className="space-y-8">
            {intro && <Section block={intro} />}
            <div className={`rounded-2xl bg-white p-5 ring-1 ${accent.ring}`}>
              <h2 className="text-xl font-semibold text-ink-900">{listings?.heading}</h2>
              {listings?.paragraphs.map((p, i) => <p key={i} className="mt-3 text-ink-700 leading-relaxed">{p}</p>)}
              {listingsSlot && <div className="mt-5">{listingsSlot}</div>}
            </div>
            {price && <Section block={price} soft={accent.soft} />}
            {amen && <Section block={amen} />}
            {guide && <Section block={guide} />}
            {conn && <Section block={conn} />}
            {faq && <FaqBlock block={faq} />}
            {close && (
              <div className={`rounded-2xl ${accent.bg} px-6 py-7 text-white`}>
                <h2 className="text-xl font-semibold">{close.heading}</h2>
                {close.paragraphs.map((p, i) => <p key={i} className="mt-3 leading-relaxed">{p}</p>)}
                <Link href="/" className="mt-4 inline-block rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-ink-900">← Back to AapKaPlot home</Link>
              </div>
            )}
          </main>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className={`rounded-2xl bg-white p-5 ring-1 ${accent.ring}`}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-500">Quick facts</h3>
              <ul className="mt-3 space-y-2 text-sm text-ink-700">
                <li><strong>Tier:</strong> {geo.tier}</li>
                {geo.state && <li><strong>State:</strong> {geo.state.replace(/-/g, " ")}</li>}
                <li><strong>Coordinates:</strong> {geo.lat.toFixed(3)}, {geo.lng.toFixed(3)}</li>
              </ul>
            </div>
            <RelatedLinks links={relatedLinks} accent={accent} />
          </aside>
        </div>
      </div>
    </article>
  );
}

function Section({ block, soft }: { block: { heading: string; paragraphs: string[] }; soft?: string }) {
  return (
    <section className={soft ? `rounded-2xl ${soft} p-5 ring-1 ring-black/5` : ""}>
      <h2 className="text-xl font-semibold text-ink-900">{block.heading}</h2>
      {block.paragraphs.map((p, i) => (
        <p key={i} className="mt-3 text-ink-700 leading-relaxed">{p}</p>
      ))}
    </section>
  );
}

function FaqBlock({ block }: { block: { heading: string; paragraphs: string[]; data?: { faqs?: { q: string; a: string }[] } } }) {
  const faqs = block.data?.faqs ?? [];
  return (
    <section>
      <h2 className="text-xl font-semibold text-ink-900">{block.heading}</h2>
      <div className="mt-3 divide-y divide-ink-200 rounded-2xl bg-white ring-1 ring-black/5">
        {faqs.map((f, i) => (
          <details key={i} className="group p-5 open:bg-ink-50/40">
            <summary className="cursor-pointer font-medium text-ink-900">{f.q}</summary>
            <p className="mt-3 text-ink-700 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function RelatedLinks({ links, accent }: { links: { label: string; href: string }[]; accent: { text: string; ring: string } }) {
  if (!links.length) return null;
  return (
    <div className={`rounded-2xl bg-white p-5 ring-1 ${accent.ring}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-500">Related searches</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={`${accent.text} hover:underline`}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
