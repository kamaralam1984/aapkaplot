import Link from "next/link";
import { prisma } from "@/server/db";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { isSuperAdminRole } from "@/lib/session";
import { getSession } from "@/lib/auth-server";
import { SeoRowActions, GenerateBatchButton, BulkRebuildRejectedButton } from "./SeoActions";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  template?: string;
  quality?: string;     // "high" | "mid" | "low"
  q?: string;
  page?: string;
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
        <SectionHeader
          eyebrow="SEO"
          title="Programmatic SEO Pages"
          subtitle="DB is disabled. Set USE_DB=1 to manage generated SEO pages."
        />
      </div>
    );
  }

  const page = Math.max(1, Number(sp.page) || 1);
  const status = (sp.status ?? "").toUpperCase();
  const template = (sp.template ?? "").toUpperCase();
  const qualityKey = sp.quality ?? "";
  const q = sp.q?.trim() ?? "";

  const where: Record<string, unknown> = {};
  if (["PUBLISHED", "REJECTED", "PENDING", "ARCHIVED"].includes(status)) where.status = status;
  if (Object.keys(TEMPLATE_LABEL).includes(template)) where.template = template;
  const qBucket = QUALITY_BUCKETS.find((b) => b.slug === qualityKey);
  if (qBucket) where.qualityScore = { gte: qBucket.min, lte: qBucket.max };
  if (q) where.OR = [{ slug: { contains: q, mode: "insensitive" } }, { title: { contains: q, mode: "insensitive" } }];

  const [rows, total, statsAgg, rejectedCount, publishedCount, archivedCount, pendingCount] = await Promise.all([
    prisma.seoPage.findMany({
      where,
      select: {
        id: true, slug: true, status: true, template: true, title: true,
        qualityScore: true, wordCount: true, sources: true, keywords: true,
        lastBuiltAt: true, lastIndexedAt: true, publishedAt: true,
        content: false,
      },
      orderBy: [{ lastBuiltAt: "desc" }],
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
    }),
    prisma.seoPage.count({ where }),
    prisma.seoPage.aggregate({
      _avg: { qualityScore: true, wordCount: true },
      _count: { id: true },
      where: { status: "PUBLISHED" },
    }),
    prisma.seoPage.count({ where: { status: "REJECTED" } }),
    prisma.seoPage.count({ where: { status: "PUBLISHED" } }),
    prisma.seoPage.count({ where: { status: "ARCHIVED" } }),
    prisma.seoPage.count({ where: { status: "PENDING" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <SectionHeader
        eyebrow="SEO"
        title="Programmatic SEO Pages"
        subtitle="Daily-generated city, locality and property pages. Quality-gated at 70+, max 100/day."
        actions={
          <div className="flex flex-wrap gap-2">
            <BulkRebuildRejectedButton count={rejectedCount} />
            <GenerateBatchButton />
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard label="Published" value={publishedCount} tone="emerald" />
        <StatCard label="Rejected" value={rejectedCount} tone="rose" />
        <StatCard label="Pending" value={pendingCount} tone="amber" />
        <StatCard label="Archived" value={archivedCount} tone="ink" />
        <StatCard label="Avg quality" value={statsAgg._avg.qualityScore ? Math.round(statsAgg._avg.qualityScore) : "—"} suffix="/100" tone="violet" />
      </div>

      {/* Filters */}
      <form className="rounded-2xl bg-white p-4 ring-1 ring-ink-200/70" action="/admin/seo">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Search</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="slug or title…"
              className="mt-1 h-9 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Status</span>
            <select name="status" defaultValue={status} className="mt-1 h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm">
              <option value="">All</option>
              <option value="PUBLISHED">Published</option>
              <option value="REJECTED">Rejected</option>
              <option value="PENDING">Pending</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Template</span>
            <select name="template" defaultValue={template} className="mt-1 h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm">
              <option value="">All</option>
              {Object.entries(TEMPLATE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Quality</span>
            <select name="quality" defaultValue={qualityKey} className="mt-1 h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-sm">
              <option value="">All</option>
              {QUALITY_BUCKETS.map((b) => (
                <option key={b.slug} value={b.slug}>{b.label}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button className="h-9 rounded-lg bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-ink-800">Apply</button>
            <Link href="/admin/seo" className="h-9 inline-flex items-center rounded-lg px-3 text-sm text-ink-600 hover:text-ink-900">Reset</Link>
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/70">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ink-200/70 text-sm">
            <thead className="bg-ink-50/60 text-left text-[11.5px] uppercase tracking-wider text-ink-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Page</th>
                <th className="px-3 py-3 font-semibold">Template</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Quality</th>
                <th className="px-3 py-3 font-semibold">Words</th>
                <th className="px-3 py-3 font-semibold">Sources</th>
                <th className="px-3 py-3 font-semibold">Built</th>
                <th className="px-3 py-3 font-semibold">Indexed</th>
                <th className="px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/60">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-ink-500">
                    No SEO pages match this filter. Click <strong>Generate next batch</strong> above to create the first set.
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
                  </td>
                  <td className="px-3 py-3 align-top text-xs">
                    <span className="rounded-md bg-violet-50 px-2 py-0.5 text-violet-700">
                      {TEMPLATE_LABEL[r.template] ?? r.template}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase ${STATUS_STYLE[r.status] ?? STATUS_STYLE.PENDING}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <QualityPill score={r.qualityScore} />
                  </td>
                  <td className="px-3 py-3 align-top text-ink-700">{r.wordCount}</td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-wrap gap-1">
                      {r.sources.map((s) => (
                        <span key={s} className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-700">
                          {s.replace("aapkaplot-listings", "listings").replace("openstreetmap", "osm")}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top text-xs text-ink-500">{timeAgo(r.lastBuiltAt)}</td>
                  <td className="px-3 py-3 align-top text-xs text-ink-500">
                    {r.lastIndexedAt ? timeAgo(r.lastIndexedAt) : <span className="text-ink-400">—</span>}
                  </td>
                  <td className="px-3 py-3 align-top text-right">
                    <SeoRowActions
                      id={r.id}
                      slug={r.slug}
                      status={r.status}
                      canDelete={canDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ink-200/60 px-4 py-3 text-xs text-ink-600">
            <span>Page {page} of {totalPages} · {total} total</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/seo?${buildQuery(sp, { page: String(page - 1) })}`} className="rounded-md border border-ink-200 px-3 py-1 hover:bg-ink-50">Prev</Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/seo?${buildQuery(sp, { page: String(page + 1) })}`} className="rounded-md border border-ink-200 px-3 py-1 hover:bg-ink-50">Next</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function StatCard({ label, value, suffix, tone }: { label: string; value: number | string; suffix?: string; tone: "emerald" | "rose" | "amber" | "ink" | "violet" }) {
  const TONE: Record<typeof tone, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose:    "bg-rose-50 text-rose-700",
    amber:   "bg-amber-50 text-amber-800",
    ink:     "bg-ink-50 text-ink-700",
    violet:  "bg-violet-50 text-violet-700",
  };
  return (
    <div className="rounded-2xl bg-white ring-1 ring-ink-200/70 p-4">
      <p className={`inline-block rounded-md px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ${TONE[tone]}`}>{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink-900">
        {value}{suffix && <span className="text-sm text-ink-500 ml-1">{suffix}</span>}
      </p>
    </div>
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
