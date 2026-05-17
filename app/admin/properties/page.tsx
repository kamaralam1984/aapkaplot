import Link from "next/link";
import Image from "next/image";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { PropertyAdminActions } from "./PropertyAdminActions";
import { isSuperAdminRole } from "@/lib/session";
import { getSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  kind?: string;
  intent?: string;
  city?: string;
  q?: string;
  page?: string;
};

const STATUS_OPTIONS = ["", "PENDING_REVIEW", "ACTIVE", "DRAFT", "PAUSED", "SOLD", "REJECTED"] as const;
const KIND_OPTIONS = ["", "PLOT", "FLAT", "HOUSE", "VILLA", "SHOP", "OFFICE"] as const;
const INTENT_OPTIONS = ["", "BUY", "RENT", "SELL"] as const;

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  PENDING_REVIEW: "bg-amber-50 text-amber-800 border-amber-200/70",
  DRAFT: "bg-ink-50 text-ink-600 border-ink-200/70",
  PAUSED: "bg-sky-50 text-sky-700 border-sky-200/70",
  SOLD: "bg-violet-50 text-violet-700 border-violet-200/70",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200/70",
};

function inr(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const canDelete = isSuperAdminRole(session?.role);

  if (process.env.USE_DB !== "1") {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Catalogue" title="Properties" subtitle="Manage every listing on AapKaPlot." />
        <div className="surface-card p-6 text-[13.5px] text-rose-700">
          DB is disabled (USE_DB ≠ 1). Set USE_DB=1 in .env.local and rebuild to enable this view.
        </div>
      </div>
    );
  }

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const pageSize = 25;
  const status = sp.status && STATUS_OPTIONS.includes(sp.status as never) && sp.status !== "" ? sp.status : undefined;
  const kind = sp.kind && KIND_OPTIONS.includes(sp.kind as never) && sp.kind !== "" ? sp.kind : undefined;
  const intent = sp.intent && INTENT_OPTIONS.includes(sp.intent as never) && sp.intent !== "" ? sp.intent : undefined;
  const city = sp.city?.trim() || undefined;
  const q = sp.q?.trim() || undefined;

  const where: Prisma.PropertyWhereInput = {
    ...(status ? { status: status as Prisma.EnumListingStatusFilter["equals"] } : {}),
    ...(kind ? { kind: kind as Prisma.EnumPropertyKindFilter["equals"] } : {}),
    ...(intent ? { intent: intent as Prisma.EnumListingIntentFilter["equals"] } : {}),
    ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { locality: { contains: q, mode: "insensitive" } },
            { id: { equals: q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" } as Prisma.PropertyOrderByWithRelationInput,
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        title: true,
        kind: true,
        intent: true,
        status: true,
        priceInr: true,
        areaSqft: true,
        city: true,
        locality: true,
        verified: true,
        trustScore: true,
        coverUrl: true,
        createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Catalogue"
        title="Properties"
        subtitle={`Manage every plot, flat, house and project listing. Total: ${total.toLocaleString("en-IN")}.`}
      />

      <form className="surface-card flex flex-wrap items-end gap-3 p-4" method="get">
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Search</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="title, locality or id"
            className="mt-1 h-10 w-64 rounded-lg border border-ink-200 px-3 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">City</span>
          <input
            name="city"
            defaultValue={city ?? ""}
            placeholder="Kolkata"
            className="mt-1 h-10 w-40 rounded-lg border border-ink-200 px-3 text-[13px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Status</span>
          <select name="status" defaultValue={status ?? ""} className="mt-1 h-10 w-40 rounded-lg border border-ink-200 px-2 text-[13px]">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "" ? "All" : s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Kind</span>
          <select name="kind" defaultValue={kind ?? ""} className="mt-1 h-10 w-36 rounded-lg border border-ink-200 px-2 text-[13px]">
            {KIND_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {k === "" ? "All" : k}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Intent</span>
          <select name="intent" defaultValue={intent ?? ""} className="mt-1 h-10 w-32 rounded-lg border border-ink-200 px-2 text-[13px]">
            {INTENT_OPTIONS.map((i) => (
              <option key={i} value={i}>
                {i === "" ? "All" : i}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-10 rounded-lg bg-ink-900 px-4 text-[13px] font-semibold text-white hover:bg-ink-800"
        >
          Filter
        </button>
        <Link
          href="/admin/properties"
          className="h-10 rounded-lg border border-ink-200 px-4 text-[13px] font-semibold text-ink-700 hover:bg-ink-50 inline-flex items-center"
        >
          Reset
        </Link>
      </form>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead className="bg-ink-50/60 text-[11px] uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Kind / Intent</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                    No properties match these filters.
                  </td>
                </tr>
              )}
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-ink-200/60 hover:bg-ink-50/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-ink-100">
                        {p.coverUrl && (
                          <Image src={p.coverUrl} alt="" fill className="object-cover" sizes="64px" unoptimized />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-ink-900 line-clamp-1">{p.title}</div>
                        <div className="text-[12px] text-ink-500">
                          {p.locality}, {p.city} · {p.areaSqft.toLocaleString("en-IN")} sqft
                          {p.verified && <span className="ml-2 text-emerald-700">✓ verified</span>}
                        </div>
                        <div className="text-[11px] text-ink-400 font-mono">{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12.5px]">
                    <div>{p.kind}</div>
                    <div className="text-ink-500">{p.intent}</div>
                  </td>
                  <td className="px-4 py-3 text-[12.5px]">
                    <div>{p.owner?.name ?? "—"}</div>
                    <div className="text-ink-500">{p.owner?.email ?? ""}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{inr(p.priceInr)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                        STATUS_STYLE[p.status] ?? STATUS_STYLE.DRAFT
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PropertyAdminActions
                      id={p.id}
                      status={p.status}
                      verified={p.verified}
                      canDelete={canDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-ink-200/70 px-4 py-3 text-[12.5px] text-ink-600">
            <div>
              Page {page} of {pages} · {total.toLocaleString("en-IN")} listings
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={{ query: { ...sp, page: String(page - 1) } }}
                  className="rounded-lg border border-ink-200 px-3 py-1.5 hover:bg-ink-50"
                >
                  ← Prev
                </Link>
              )}
              {page < pages && (
                <Link
                  href={{ query: { ...sp, page: String(page + 1) } }}
                  className="rounded-lg border border-ink-200 px-3 py-1.5 hover:bg-ink-50"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
