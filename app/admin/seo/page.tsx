import Link from "next/link";
import { prisma } from "@/server/db";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { isSuperAdminRole } from "@/lib/session";
import { getSession } from "@/lib/auth-server";
import {
  SeoRowActions, GenerateBatchButton, BulkRebuildRejectedButton,
  TopActionBar, AuditPanel, GscPanel, DeleteBelowControl, PingIndexNowButton,
} from "./SeoActions";
import { fetchGscPerformance, type GscResult } from "@/lib/seo/gsc";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  template?: string;
  quality?: string;
  category?: string;
  source?: string;
  q?: string;
  page?: string;
  sort?: string;
};

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  PENDING:   "bg-amber-50 text-amber-800 border-amber-200/70",
  REJECTED:  "bg-rose-50 text-rose-700 border-rose-200/70",
  ARCHIVED:  "bg-ink-50 text-ink-600 border-ink-200/70",
};

const TEMPLATE_LABEL: Record<string, string> = {
  OVERVIEW_MAP: "Overview · Map",
  BUYING_GUIDE: "Buying guide",
  PRICE_DASHBOARD: "Price dashboard",
  COMPARISON: "Comparison",
  INVESTMENT_OUTLOOK: "Investment outlook",
  KNOWLEDGE_FAQ: "Knowledge / FAQ",
};

const QUALITY_BUCKETS = [
  { slug: "high", label: "High (≥90)", min: 90, max: 100 },
  { slug: "mid",  label: "Mid (70–89)", min: 70, max: 89 },
  { slug: "low",  label: "Low (<70)",  min: 0,  max: 69 },
] as const;

const PER_PAGE = 50;

export default async function AdminSeoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const canDelete = isSuperAdminRole(session?.role);

  if (process.env.USE_DB !== "1") {
    return (
      <div className="space-y-6 p-6">
        <SectionHeader eyebrow="SEO" title="Programmatic SEO Pages" subtitle="DB disabled. Set USE_DB=1." />
      </div>
    );
  }

  const page = Math.max(1, Number(sp.page) || 1);
  const status = (sp.status ?? "").toUpperCase();
  const template = (sp.template ?? "").toUpperCase();
  const qualityKey = sp.quality ?? "";
  const category = sp.category ?? "";  // intent-kind, e.g. "buy-plot"
  const source = sp.source ?? "";       // wikipedia / openstreetmap / aapkaplot-listings
  const sort = sp.sort ?? "built";       // built | quality | clicks | position
  const q = sp.q?.trim() ?? "";

  const where: Record<string, unknown> = {};
  if (["PUBLISHED", "REJECTED", "PENDING", "ARCHIVED"].includes(status)) where.status = status;
  if (Object.keys(TEMPLATE_LABEL).includes(template)) where.template = template;
  const qBucket = QUALITY_BUCKETS.find((b) => b.slug === qualityKey);
  if (qBucket) where.qualityScore = { gte: qBucket.min, lte: qBucket.max };
  if (category && category.includes("-")) {
    const [intent, kind] = category.split("-");
    where.intent = intent;
    where.kind = kind;
  }
  if (source) where.sources = { has: source };
  if (q) where.OR = [{ slug: { contains: q, mode: "insensitive" } }, { title: { contains: q, mode: "insensitive" } }];

  // Sort dispatch
  const orderBy: Record<string, unknown> =
    sort === "quality" ? { qualityScore: "desc" } :
    sort === "clicks"  ? { gscClicks: { sort: "desc", nulls: "last" } } :
    sort === "position"? { gscPosition: { sort: "asc", nulls: "last" } } :
                         { lastBuiltAt: "desc" };

  const now = new Date();
  const dayAgo  = new Date(now.getTime() - 1 * 86400 * 1000);
  const sevenAgo = new Date(now.getTime() - 7 * 86400 * 1000);
  const thirtyAgo = new Date(now.getTime() - 30 * 86400 * 1000);

  const [
    rows, total,
    totalPages, todayCount, sevenCount, thirtyCount,
    publishedCount, rejectedCount, pendingCount, archivedCount,
    statsAgg, flaggedCount,
  ] = await Promise.all([
    prisma.seoPage.findMany({
      where,
      select: {
        id: true, slug: true, status: true, template: true, title: true,
        qualityScore: true, wordCount: true, sources: true, keywords: true,
        lastBuiltAt: true, lastIndexedAt: true, publishedAt: true,
        intent: true, kind: true,
        gscClicks: true, gscImpressions: true, gscCtr: true, gscPosition: true,
        qualityFlags: true,
      },
      orderBy,
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
    }),
    prisma.seoPage.count({ where }),
    prisma.seoPage.count(),
    prisma.seoPage.count({ where: { lastBuiltAt: { gte: dayAgo } } }),
    prisma.seoPage.count({ where: { lastBuiltAt: { gte: sevenAgo } } }),
    prisma.seoPage.count({ where: { lastBuiltAt: { gte: thirtyAgo } } }),
    prisma.seoPage.count({ where: { status: "PUBLISHED" } }),
    prisma.seoPage.count({ where: { status: "REJECTED" } }),
    prisma.seoPage.count({ where: { status: "PENDING" } }),
    prisma.seoPage.count({ where: { status: "ARCHIVED" } }),
    prisma.seoPage.aggregate({
      _avg: { qualityScore: true },
      where: { status: "PUBLISHED" },
    }),
    prisma.seoPage.count({ where: { NOT: { qualityFlags: { isEmpty: true } } } }),
  ]);

  // GSC snapshot — quick fetch; the panel handles the notConfigured/error UX.
  const gsc: GscResult = await fetchGscPerformance().catch((e) => ({
    status: "error" as const,
    code: "exception",
    message: (e as Error).message,
  }));

  const totalListPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const avgQ = statsAgg._avg.qualityScore ? Math.round(statsAgg._avg.qualityScore) : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SectionHeader
          eyebrow="SEO"
          title="SEO Pages"
          subtitle="Auto-generated programmatic pages — quality-gated indexing, GSC performance, bulk edit & remove."
        />
        <TopActionBar
          rejectedCount={rejectedCount}
          canDelete={canDelete}
        />
        <PingIndexNowButton />
      </div>

      <DeleteBelowControl canDelete={canDelete} />

      {/* Stats — 8 cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <StatCard label="Total" value={totalPages} tone="ink" />
        <StatCard label="Today" value={todayCount} tone="emerald" />
        <StatCard label="Last 7 days" value={sevenCount} tone="emerald" />
        <StatCard label="Last 30 days" value={thirtyCount} tone="emerald" />
        <StatCard label="Indexable" value={publishedCount} hint="in sitemap" tone="sky" />
        <StatCard label="Pending" value={pendingCount} hint="≥0 score" tone="amber" />
        <StatCard label="Rejected" value={rejectedCount} hint="below threshold" tone="rose" />
        <StatCard label="Avg quality" value={avgQ} suffix="/100" tone="violet" />
      </div>

      {/* GSC + Audit panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GscPanel
          status={gsc.status}
          summary={
            gsc.status === "ok"
              ? {
                  range: gsc.range,
                  rows: gsc.rows.length,
                  clicks: gsc.rows.reduce((s, r) => s + r.clicks, 0),
                  impressions: gsc.rows.reduce((s, r) => s + r.impressions, 0),
                }
              : null
          }
          reason={gsc.status === "notConfigured" ? gsc.reason : gsc.status === "error" ? `${gsc.code}: ${gsc.message}` : ""}
        />
        <AuditPanel flaggedCount={flaggedCount} />
      </div>

      {/* Filters */}
      <form className="rounded-2xl bg-white p-4 ring-1 ring-ink-200/70" action="/admin/seo">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="text-[10.5px] font-medium uppercase tracking-wider text-ink-500">Search</span>
            <input
              name="q" defaultValue={q}
              placeholder="keyword, title, slug…"
              className="mt-1 h-9 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm"
            />
          </label>
          <SelectField name="status" label="Status" defaultValue={status} options={[
            ["", "All status"], ["PUBLISHED", "Published"], ["REJECTED", "Rejected"],
            ["PENDING", "Pending"], ["ARCHIVED", "Archived"],
          ]} />
          <SelectField name="category" label="Category" defaultValue={category} options={[
            ["", "All categories"],
            ...["buy-plot","buy-flat","buy-house","buy-villa","buy-godown","buy-shop","buy-office","buy-pg",
                "rent-plot","rent-flat","rent-house","rent-villa","rent-godown","rent-shop","rent-office","rent-pg"]
              .map((v) => [v, v.replace("-", " · ")] as [string, string]),
          ]} />
          <SelectField name="source" label="Sources" defaultValue={source} options={[
            ["", "All sources"],
            ["wikipedia", "Wikipedia"],
            ["openstreetmap", "OpenStreetMap"],
            ["aapkaplot-listings", "Live listings"],
          ]} />
          <SelectField name="template" label="Template" defaultValue={template} options={[
            ["", "All templates"],
            ...Object.entries(TEMPLATE_LABEL),
          ]} />
          <SelectField name="quality" label="Quality" defaultValue={qualityKey} options={[
            ["", "All quality"],
            ...QUALITY_BUCKETS.map((b) => [b.slug, b.label] as [string, string]),
          ]} />
          <div className="flex items-end gap-2">
            <SelectField name="sort" label="Sort by" defaultValue={sort} options={[
              ["built", "Built"], ["quality", "Quality"], ["clicks", "Clicks"], ["position", "Avg position"],
            ]} />
            <button className="h-9 rounded-lg bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-ink-800">Apply</button>
          </div>
        </div>
        {(q || status || template || qualityKey || category || source || sort !== "built") && (
          <div className="mt-2 text-right">
            <Link href="/admin/seo" className="text-xs text-ink-500 hover:text-ink-900">Clear filters</Link>
          </div>
        )}
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/70">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ink-200/70 text-sm">
            <thead className="bg-ink-50/60 text-left text-[11px] uppercase tracking-wider text-ink-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Keyword / Slug</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Quality</th>
                <th className="px-3 py-3 font-semibold text-right">Clicks</th>
                <th className="px-3 py-3 font-semibold text-right">Impr.</th>
                <th className="px-3 py-3 font-semibold text-right">CTR</th>
                <th className="px-3 py-3 font-semibold text-right">Pos.</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 font-semibold">Built</th>
                <th className="px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/60">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-ink-500">
                    No SEO pages match this filter. Use <strong>Generate Trending</strong> or <strong>Generate Batch</strong> to create the first set.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-ink-50/40">
                  <td className="px-4 py-3 align-top">
                    <Link href={`/seo/${r.slug}`} target="_blank" className="font-medium text-ink-900 hover:text-brand-600 break-all">
                      /seo/{r.slug}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-500 line-clamp-1">{r.title}</p>
                    {r.qualityFlags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.qualityFlags.map((f) => (
                          <span key={f} className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-rose-700">
                            ⚠ {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase ${STATUS_STYLE[r.status] ?? STATUS_STYLE.PENDING}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <QualityPill score={r.qualityScore} />
                  </td>
                  <td className="px-3 py-3 align-top text-right text-ink-700 tabular-nums">
                    {r.gscClicks ?? <span className="text-ink-300">—</span>}
                  </td>
                  <td className="px-3 py-3 align-top text-right text-ink-700 tabular-nums">
                    {r.gscImpressions ?? <span className="text-ink-300">—</span>}
                  </td>
                  <td className="px-3 py-3 align-top text-right text-ink-700 tabular-nums">
                    {r.gscCtr != null ? `${(r.gscCtr * 100).toFixed(1)}%` : <span className="text-ink-300">—</span>}
                  </td>
                  <td className="px-3 py-3 align-top text-right text-ink-700 tabular-nums">
                    {r.gscPosition != null ? r.gscPosition.toFixed(1) : <span className="text-ink-300">—</span>}
                  </td>
                  <td className="px-3 py-3 align-top text-xs">
                    <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-violet-700">{r.intent}-{r.kind}</span>
                  </td>
                  <td className="px-3 py-3 align-top text-xs text-ink-500">{timeAgo(r.lastBuiltAt)}</td>
                  <td className="px-3 py-3 align-top text-right">
                    <SeoRowActions id={r.id} slug={r.slug} status={r.status} canDelete={canDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalListPages > 1 && (
          <div className="flex items-center justify-between border-t border-ink-200/60 px-4 py-3 text-xs text-ink-600">
            <span>Page {page} of {totalListPages} · {total} matching</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/seo?${buildQuery(sp, { page: String(page - 1) })}`} className="rounded-md border border-ink-200 px-3 py-1 hover:bg-ink-50">Prev</Link>
              )}
              {page < totalListPages && (
                <Link href={`/admin/seo?${buildQuery(sp, { page: String(page + 1) })}`} className="rounded-md border border-ink-200 px-3 py-1 hover:bg-ink-50">Next</Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Per-row Improve button is in <SeoRowActions> */}
      {rejectedCount > 0 && (
        <div className="text-sm text-ink-600">
          <BulkRebuildRejectedButton count={rejectedCount} />
        </div>
      )}
      <GenerateBatchButton />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function StatCard({ label, value, suffix, hint, tone }: {
  label: string; value: number | string; suffix?: string; hint?: string;
  tone: "emerald" | "rose" | "amber" | "ink" | "violet" | "sky"
}) {
  const TONE: Record<typeof tone, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose:    "bg-rose-50 text-rose-700",
    amber:   "bg-amber-50 text-amber-800",
    ink:     "bg-ink-50 text-ink-700",
    violet:  "bg-violet-50 text-violet-700",
    sky:     "bg-sky-50 text-sky-700",
  };
  return (
    <div className="rounded-2xl bg-white ring-1 ring-ink-200/70 p-4">
      <p className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TONE[tone]}`}>{label}</p>
      <p className="mt-2 text-xl font-semibold text-ink-900 sm:text-2xl">
        {value}{suffix && <span className="text-sm text-ink-500 ml-1">{suffix}</span>}
      </p>
      {hint && <p className="text-[11px] text-ink-500">{hint}</p>}
    </div>
  );
}

function SelectField({ name, label, defaultValue, options }: {
  name: string; label: string; defaultValue?: string; options: ([string, string] | string[])[];
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] font-medium uppercase tracking-wider text-ink-500">{label}</span>
      <select name={name} defaultValue={defaultValue} className="mt-1 h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function QualityPill({ score }: { score: number }) {
  const tone =
    score >= 90 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
    score >= 80 ? "bg-sky-50 text-sky-700 ring-sky-200" :
    score >= 70 ? "bg-amber-50 text-amber-800 ring-amber-200" :
                  "bg-rose-50 text-rose-700 ring-rose-200";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${tone}`}>
      {score}
    </span>
  );
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function buildQuery(sp: SearchParams, override: Record<string, string>): string {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...override })) {
    if (v) out.set(k, String(v));
  }
  return out.toString();
}
