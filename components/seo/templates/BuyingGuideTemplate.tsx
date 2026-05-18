/* Visually distinct: long-form article with sticky TOC, narrow column. */
import Link from "next/link";
import type { SeoTemplateProps } from "./types";

export default function BuyingGuideTemplate({
  page, geo, parentGeo, relatedLinks, listingsSlot,
}: SeoTemplateProps) {
  const ordered = page.blocks.filter((b) => b.kind !== "closing");
  const close = page.blocks.find((b) => b.kind === "closing");

  return (
    <article className="mx-auto max-w-5xl px-4 py-6 sm:py-12">
      <div className="text-xs uppercase tracking-widest text-amber-700">
        Guide · {parentGeo ? `${parentGeo.name} • ${geo.name}` : geo.name}
      </div>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-ink-900">
        {page.h1}
      </h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[240px_1fr]">
        <nav className="lg:sticky lg:top-24 lg:self-start text-sm">
          <p className="font-semibold text-ink-900 uppercase tracking-wider text-xs">In this guide</p>
          <ol className="mt-3 space-y-2 list-decimal list-inside text-ink-600">
            {ordered.map((b, i) => (
              <li key={i}>
                <a href={`#sec-${i}`} className="hover:text-amber-700">{b.heading}</a>
              </li>
            ))}
          </ol>
          <div className="mt-8 rounded-xl bg-amber-50/70 p-4 ring-1 ring-amber-100 text-ink-700">
            <p className="text-xs uppercase tracking-wider text-amber-700 font-semibold">Reading time</p>
            <p className="mt-1 text-lg font-semibold text-ink-900">{Math.max(3, Math.round(page.wordCount / 220))} min</p>
          </div>
        </nav>

        <div className="prose-narrow max-w-2xl space-y-10">
          {ordered.map((b, i) => (
            <section key={i} id={`sec-${i}`}>
              <h2 className="font-display text-2xl text-ink-900 border-b border-amber-200 pb-2">
                <span className="text-amber-700 mr-2">{String(i + 1).padStart(2, "0")}</span>
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
            <section className="border-t-2 border-amber-700/30 pt-6 italic text-ink-800">
              {close.paragraphs.map((p, i) => <p key={i} className="text-lg leading-relaxed">{p}</p>)}
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
