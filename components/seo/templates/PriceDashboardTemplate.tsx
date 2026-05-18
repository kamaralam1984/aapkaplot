/* Visually distinct: data-forward dashboard. Stat cards, dense feel. */
import Link from "next/link";
import type { SeoTemplateProps } from "./types";
import { SeoPageChrome } from "./SeoPageChrome";
import { ACCENT_CLASSES } from "@/lib/seo/page-theme";

export default function PriceDashboardTemplate({
  page, geo, parentGeo, slug, theme, relatedLinks, listingsSlot,
}: SeoTemplateProps) {
  const marketing = page.blocks.find((b) => b.kind === "marketing");
  const stats = (page.blocks.find((b) => b.kind === "listings")?.data as { stats?: { total?: number; forSale?: number; forRent?: number; avgPriceLakh?: number | null; avgPriceSqftInr?: number | null; avgAreaSqft?: number | null; topKinds?: { kind: string; count: number }[] } } | undefined)?.stats;
  const poi = (page.blocks.find((b) => b.kind === "amenities")?.data as { poi?: { schools?: number; hospitals?: number; banks?: number; supermarkets?: number; parks?: number; pharmacies?: number; busStops?: number; railwayStations?: number } } | undefined)?.poi;
  const accent = ACCENT_CLASSES[theme.accent];

  const cards: { label: string; value: string; sub?: string }[] = [
    { label: "Listings", value: String(stats?.total ?? 0), sub: stats ? `${stats.forSale ?? 0} sale · ${stats.forRent ?? 0} rent` : undefined },
    { label: "Avg price", value: stats?.avgPriceLakh ? `₹${stats.avgPriceLakh}L` : "—" },
    { label: "Price / sqft", value: stats?.avgPriceSqftInr ? `₹${stats.avgPriceSqftInr.toLocaleString("en-IN")}` : "—" },
    { label: "Avg area", value: stats?.avgAreaSqft ? `${stats.avgAreaSqft} sqft` : "—" },
  ];

  return (
    <article className="bg-slate-50 min-h-screen">
      <SeoPageChrome
        slug={slug} geo={geo} parentGeo={parentGeo}
        h1={page.h1} metaDescription={page.metaDescription}
        marketing={marketing} theme={theme}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl bg-slate-900 text-white p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">{c.label}</p>
              <p className="mt-1 text-xl font-semibold font-mono">{c.value}</p>
              {c.sub && <p className="mt-0.5 text-[11px] text-slate-300">{c.sub}</p>}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-6">
            {page.blocks.filter((b) => b.kind !== "faq" && b.kind !== "closing" && b.kind !== "marketing").map((b, i) => (
              <div key={i} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <h2 className={`text-sm font-mono uppercase tracking-widest ${accent.text}`}>{b.heading}</h2>
                <div className="mt-3 space-y-3">
                  {b.paragraphs.map((p, j) => (
                    <p key={j} className="text-slate-700 leading-relaxed">{p}</p>
                  ))}
                </div>
                {b.kind === "listings" && listingsSlot && <div className="mt-4">{listingsSlot}</div>}
              </div>
            ))}
          </section>

          <aside className="space-y-5">
            {poi && (
              <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <p className={`text-xs font-mono uppercase tracking-widest ${accent.text}`}>Amenities · 2 km</p>
                <ul className="mt-3 space-y-1 text-sm font-mono">
                  {Object.entries({
                    Schools: poi.schools, Hospitals: poi.hospitals, Banks: poi.banks,
                    Supermarkets: poi.supermarkets, Pharmacies: poi.pharmacies,
                    "Bus stops": poi.busStops, "Railway stns": poi.railwayStations, Parks: poi.parks,
                  }).map(([k, v]) => (
                    <li key={k} className="flex justify-between text-slate-700">
                      <span>{k}</span><span className="font-semibold">{Number(v) || 0}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <FaqMini block={page.blocks.find((b) => b.kind === "faq")} accentText={accent.text} />
            <div className="rounded-2xl bg-slate-900 text-white p-5">
              <p className="text-xs font-mono uppercase tracking-widest text-slate-400">AapKaPlot</p>
              <p className="mt-2 text-sm leading-relaxed">All numbers come from live, verified listings on AapKaPlot — refreshed daily.</p>
              <Link href="/" className="mt-3 inline-block rounded-md bg-white text-slate-900 px-3 py-1.5 text-xs font-semibold">← Home</Link>
              <Link href="/search" className="ml-2 inline-block rounded-md bg-slate-700 text-white px-3 py-1.5 text-xs font-semibold">Browse</Link>
            </div>
            {!!relatedLinks.length && (
              <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <p className={`text-xs font-mono uppercase tracking-widest ${accent.text}`}>Related markets</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {relatedLinks.map((l) => (
                    <li key={l.href}><Link href={l.href} className="text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline">{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </article>
  );
}

function FaqMini({ block, accentText }: { block?: { paragraphs: string[]; data?: { faqs?: { q: string; a: string }[] } }; accentText: string }) {
  const faqs = block?.data?.faqs ?? [];
  if (!faqs.length) return null;
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <p className={`text-xs font-mono uppercase tracking-widest ${accentText}`}>FAQ</p>
      <div className="mt-3 space-y-3">
        {faqs.slice(0, 3).map((f, i) => (
          <details key={i}>
            <summary className="cursor-pointer text-sm font-medium text-slate-900">{f.q}</summary>
            <p className="mt-1 text-sm text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
