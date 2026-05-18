/* Visually distinct: hero-map style. Wide top hero, listings grid, side facts. */
import Link from "next/link";
import type { SeoTemplateProps } from "./types";

export default function OverviewMapTemplate({
  page, geo, parentGeo, relatedLinks, listingsSlot,
}: SeoTemplateProps) {
  const intro = page.blocks.find((b) => b.kind === "intro");
  const listings = page.blocks.find((b) => b.kind === "listings");
  const price = page.blocks.find((b) => b.kind === "price");
  const amen = page.blocks.find((b) => b.kind === "amenities");
  const guide = page.blocks.find((b) => b.kind === "guide");
  const conn = page.blocks.find((b) => b.kind === "connectivity");
  const faq = page.blocks.find((b) => b.kind === "faq");
  const close = page.blocks.find((b) => b.kind === "closing");

  return (
    <article className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-emerald-50 to-indigo-50 p-6 sm:p-10 ring-1 ring-black/5">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
          {parentGeo ? `${parentGeo.name} › ${geo.name}` : geo.name}
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-display font-semibold text-ink-900 leading-tight">
          {page.h1}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-ink-700">{page.metaDescription}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          {page.keywords.slice(0, 6).map((k) => (
            <span key={k} className="rounded-full bg-white/70 px-3 py-1 text-ink-700 ring-1 ring-black/5">{k}</span>
          ))}
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <main className="space-y-8">
          {intro && <Section block={intro} />}
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <h2 className="text-xl font-semibold text-ink-900">{listings?.heading}</h2>
            {listings?.paragraphs.map((p, i) => <p key={i} className="mt-3 text-ink-700 leading-relaxed">{p}</p>)}
            {listingsSlot && <div className="mt-5">{listingsSlot}</div>}
          </div>
          {price && <Section block={price} accent="emerald" />}
          {amen && <Section block={amen} />}
          {guide && <Section block={guide} />}
          {conn && <Section block={conn} />}
          {faq && <FaqBlock block={faq} />}
          {close && (
            <div className="rounded-2xl bg-ink-900 px-6 py-7 text-white">
              <h2 className="text-xl font-semibold">{close.heading}</h2>
              {close.paragraphs.map((p, i) => <p key={i} className="mt-3 leading-relaxed">{p}</p>)}
            </div>
          )}
        </main>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-500">Quick facts</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">
              <li><strong>Tier:</strong> {geo.tier}</li>
              {geo.state && <li><strong>State:</strong> {geo.state.replace(/-/g, " ")}</li>}
              <li><strong>Coordinates:</strong> {geo.lat.toFixed(3)}, {geo.lng.toFixed(3)}</li>
            </ul>
          </div>
          <RelatedLinks links={relatedLinks} />
        </aside>
      </div>
    </article>
  );
}

function Section({ block, accent }: { block: { heading: string; paragraphs: string[] }; accent?: "emerald" }) {
  return (
    <section className={accent === "emerald" ? "rounded-2xl bg-emerald-50/40 p-5 ring-1 ring-emerald-100" : ""}>
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

function RelatedLinks({ links }: { links: { label: string; href: string }[] }) {
  if (!links.length) return null;
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-500">Related searches</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-emerald-700 hover:underline">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
