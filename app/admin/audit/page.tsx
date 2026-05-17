import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { SectionHeader } from "@/components/dashboard/SectionHeader";

export const dynamic = "force-dynamic";

type SearchParams = { action?: string; targetType?: string; actor?: string; page?: string };

const ACTION_STYLE: Record<string, string> = {
  "property.approve":  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "property.reject":   "bg-rose-50 text-rose-700 border-rose-200",
  "property.pause":    "bg-sky-50 text-sky-700 border-sky-200",
  "property.resume":   "bg-emerald-50 text-emerald-700 border-emerald-200",
  "property.verify":   "bg-sky-50 text-sky-700 border-sky-200",
  "property.update":   "bg-ink-50 text-ink-700 border-ink-200",
  "property.delete":   "bg-rose-100 text-rose-800 border-rose-300",
  "user.create":       "bg-emerald-50 text-emerald-700 border-emerald-200",
  "user.update":       "bg-ink-50 text-ink-700 border-ink-200",
  "user.role":         "bg-violet-50 text-violet-700 border-violet-200",
  "user.suspend":      "bg-amber-50 text-amber-800 border-amber-200",
  "user.reactivate":   "bg-emerald-50 text-emerald-700 border-emerald-200",
  "user.delete":       "bg-rose-100 text-rose-800 border-rose-300",
};

const TARGET_LINK: Record<string, (id: string) => string> = {
  property: (id) => `/admin/properties?q=${encodeURIComponent(id)}`,
  user: (id) => `/admin/users?q=${encodeURIComponent(id)}`,
};

function relativeTime(d: Date) {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;

  if (process.env.USE_DB !== "1") {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Trail" title="Audit log" subtitle="DB-off mode" />
        <div className="surface-card p-6 text-[13.5px] text-rose-700">
          DB is disabled (USE_DB ≠ 1).
        </div>
      </div>
    );
  }

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const pageSize = 50;
  const where: Prisma.AdminAuditLogWhereInput = {
    ...(sp.action ? { action: sp.action } : {}),
    ...(sp.targetType ? { targetType: sp.targetType } : {}),
    ...(sp.actor
      ? {
          OR: [
            { actorId: sp.actor },
            { actorEmail: { contains: sp.actor, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Trail"
        title="Audit log"
        subtitle={`Every admin action recorded. Total: ${total.toLocaleString("en-IN")}.`}
      />

      <form method="get" className="surface-card flex flex-wrap items-end gap-3 p-4">
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Actor (email/id)</span>
          <input name="actor" defaultValue={sp.actor ?? ""} className="mt-1 h-10 w-64 rounded-lg border border-ink-200 px-3 text-[13px]" />
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Target type</span>
          <select name="targetType" defaultValue={sp.targetType ?? ""} className="mt-1 h-10 w-36 rounded-lg border border-ink-200 px-2 text-[13px]">
            <option value="">All</option>
            <option value="property">Property</option>
            <option value="user">User</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">Action</span>
          <input name="action" defaultValue={sp.action ?? ""} placeholder="property.approve" className="mt-1 h-10 w-48 rounded-lg border border-ink-200 px-3 text-[13px]" />
        </label>
        <button type="submit" className="h-10 rounded-lg bg-ink-900 px-4 text-[13px] font-semibold text-white hover:bg-ink-800">
          Filter
        </button>
        <Link href="/admin/audit" className="h-10 inline-flex items-center rounded-lg border border-ink-200 px-4 text-[13px] font-semibold text-ink-700 hover:bg-ink-50">
          Reset
        </Link>
      </form>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-ink-50/60 text-[11px] uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Meta</th>
              </tr>
            </thead>
            <tbody className="text-[12.5px]">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">No audit entries yet.</td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-ink-200/60 hover:bg-ink-50/40 align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-ink-600">
                    <div>{relativeTime(r.createdAt)}</div>
                    <div className="text-[11px] text-ink-400">{r.createdAt.toISOString().replace("T", " ").slice(0, 19)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-ink-800">{r.actorEmail ?? "—"}</div>
                    <div className="text-[11px] text-ink-400 font-mono">{r.actorId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${ACTION_STYLE[r.action] ?? "bg-ink-50 text-ink-700 border-ink-200"}`}>
                      {r.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-ink-700">{r.targetType}</div>
                    {TARGET_LINK[r.targetType] ? (
                      <Link
                        href={TARGET_LINK[r.targetType](r.targetId)}
                        className="text-[11px] font-mono text-brand-600 hover:underline"
                      >
                        {r.targetId}
                      </Link>
                    ) : (
                      <div className="text-[11px] font-mono text-ink-400">{r.targetId}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[11px] text-ink-600">
                      {r.meta ? JSON.stringify(r.meta, null, 0) : "—"}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-ink-200/70 px-4 py-3 text-[12.5px] text-ink-600">
            <div>Page {page} of {pages}</div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={{ query: { ...sp, page: String(page - 1) } }} className="rounded-lg border border-ink-200 px-3 py-1.5 hover:bg-ink-50">
                  ← Prev
                </Link>
              )}
              {page < pages && (
                <Link href={{ query: { ...sp, page: String(page + 1) } }} className="rounded-lg border border-ink-200 px-3 py-1.5 hover:bg-ink-50">
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
