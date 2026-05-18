/* Visually distinct: FAQ-led learn-mode page. Q&A first, listings after. */
import Link from "next/link";
import type { SeoTemplateProps } from "./types";

export default function KnowledgeFaqTemplate({
  page, geo, parentGeo, relatedLinks, listingsSlot,
}: SeoTemplateProps) {
  const faq = page.blocks.find((b) => b.kind === "faq");
  const intro = page.blocks.find((b) => b.kind === "intro");
  const guide = page.blocks.find((b) => b.kind === "guide");
  const price = page.blocks.find((b) => b.kind === "price");
  const amen = page.blocks.find((b) => b.kind === "amenities");
  const conn = page.blocks.find((b) => b.kind === "connectivity");
  const listings = page.blocks.find((b) => b.kind === "listings");

  const faqs = (faq?.data?.faqs as { q: string; a: string }[] | undefined) ?? [];

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
        Knowledge base · {parentGeo ? `${parentGeo.name} / ${geo.name}` : geo.name}
      </p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-ink-900">{page.h1}</h1>
      <p className="mt-3 text-ink-700 leading-relaxed">{intro?.paragraphs[0]}</p>

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-teal-700">Most asked</h2>
        <div className="mt-3 space-y-3">
          {faqs.map((f, i) => (
            <details key={i} className="group rounded-2xl bg-teal-50/40 ring-1 ring-teal-100 p-5 open:bg-white open:ring-teal-300">
              <summary className="cursor-pointer flex items-start justify-between gap-4">
                <span className="font-semibold text-ink-900">{f.q}</span>
                <span className="text-teal-700 text-xl leading-none group-open:rotate-45 transition">+</span>
              </summary>
              <p className="mt-3 text-ink-700 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-teal-700">Deep dive</h2>
        <div className="mt-4 space-y-8">
          {[intro, price, amen, conn, guide].filter(Boolean).map((b, i) => (
            <div key={i}>
              <h3 className="font-display text-xl text-ink-900">{b!.heading}</h3>
              {b!.paragraphs.slice(b!.kind === "intro" ? 1 : 0).map((p, j) => (
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
        </section>
      )}

      {!!relatedLinks.length && (
        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-widest font-semibold text-teal-700">Continue learning</h2>
          <ul className="mt-3 space-y-1.5">
            {relatedLinks.map((l) => (
              <li key={l.href}>→ <Link href={l.href} className="text-ink-800 hover:text-teal-700 underline-offset-2 hover:underline">{l.label}</Link></li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
