/* Visually distinct: vertical-timeline narrative, investor lens. */
import Link from "next/link";
import type { SeoTemplateProps } from "./types";

export default function InvestmentOutlookTemplate({
  page, geo, parentGeo, relatedLinks, listingsSlot,
}: SeoTemplateProps) {
  const stages = page.blocks.filter((b) => b.kind !== "closing");
  const close = page.blocks.find((b) => b.kind === "closing");

  return (
    <article className="bg-gradient-to-b from-indigo-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Investment outlook</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-ink-900">{page.h1}</h1>
        <p className="mt-3 text-lg text-ink-700">
          {parentGeo ? `${geo.name} within the ${parentGeo.name} market` : `Reading the ${geo.name} property market`}
        </p>

        <ol className="mt-12 relative border-l-2 border-indigo-200 space-y-12 pl-6">
          {stages.map((b, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[35px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-semibold ring-4 ring-white">
                {i + 1}
              </span>
              <h2 className="text-xl font-display font-semibold text-ink-900">{b.heading}</h2>
              {b.kind === "faq" ? (
                <div className="mt-3 space-y-3">
                  {(b.data?.faqs as { q: string; a: string }[] | undefined)?.map((f, j) => (
                    <div key={j} className="rounded-xl bg-white ring-1 ring-indigo-100 p-4">
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
                <div className="mt-4 rounded-2xl bg-white ring-1 ring-indigo-100 p-4">{listingsSlot}</div>
              )}
            </li>
          ))}
        </ol>

        {close && (
          <div className="mt-12 rounded-3xl bg-indigo-900 text-white px-8 py-10">
            <h2 className="text-2xl font-display font-semibold">{close.heading}</h2>
            {close.paragraphs.map((p, i) => <p key={i} className="mt-3 text-indigo-100 leading-relaxed">{p}</p>)}
          </div>
        )}

        {!!relatedLinks.length && (
          <div className="mt-10">
            <p className="text-xs uppercase tracking-wider font-semibold text-ink-500">More outlooks</p>
            <ul className="mt-3 grid sm:grid-cols-2 gap-2">
              {relatedLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block rounded-lg bg-white ring-1 ring-indigo-100 p-3 text-ink-800 hover:bg-indigo-50">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
