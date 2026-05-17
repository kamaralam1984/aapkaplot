import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Database } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/**
 * Generic table viewer. We hand-list each model rather than dynamic
 * dispatch via prisma[modelName] because Prisma's typed client is, well,
 * typed — each .findMany has its own select shape. Adding a new model
 * here is < 6 lines and lets the inspector stay strictly server-side.
 */
type Loader = (page: number) => Promise<{ rows: Record<string, unknown>[]; total: number; columns: string[] }>;

const TABLE: Record<string, { label: string; load: Loader }> = {
  user: {
    label: "Users",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: { id: true, name: true, email: true, phone: true, role: true, address: true, createdAt: true },
        }),
        prisma.user.count(),
      ]);
      return {
        rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
        total,
        columns: ["id", "name", "email", "phone", "role", "address", "createdAt"],
      };
    },
  },
  property: {
    label: "Properties",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.property.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: {
            id: true, title: true, kind: true, intent: true, status: true,
            priceInr: true, areaSqft: true, locality: true, city: true,
            verified: true, ownerId: true, createdAt: true,
          },
        }),
        prisma.property.count(),
      ]);
      return {
        rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
        total,
        columns: ["id", "title", "kind", "intent", "status", "priceInr", "areaSqft", "locality", "city", "verified", "ownerId", "createdAt"],
      };
    },
  },
  lead: {
    label: "Leads",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.lead.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        prisma.lead.count(),
      ]);
      return {
        rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })),
        total,
        columns: ["id", "fromUserId", "toUserId", "propertyId", "status", "offerAmountInr", "offerStatus", "via", "createdAt"],
      };
    },
  },
  message: {
    label: "Messages",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.message.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.message.count(),
      ]);
      return {
        rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
        total,
        columns: ["id", "leadId", "fromUserId", "body", "createdAt"],
      };
    },
  },
  payment: {
    label: "Payments",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.payment.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.payment.count(),
      ]);
      return {
        rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
        total,
        columns: ["id", "userId", "propertyId", "plan", "amountInr", "status", "provider", "createdAt"],
      };
    },
  },
  favorite: {
    label: "Favorites",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.favorite.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.favorite.count(),
      ]);
      return {
        rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
        total,
        columns: ["id", "userId", "propertyId", "createdAt"],
      };
    },
  },
  visitrequest: {
    label: "Visit requests",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.visitRequest.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.visitRequest.count(),
      ]);
      return {
        rows: rows.map((r) => ({ ...r, scheduledFor: r.scheduledFor?.toISOString() ?? null, createdAt: r.createdAt.toISOString() })),
        total,
        columns: Object.keys(rows[0] ?? {}),
      };
    },
  },
  savedsearch: {
    label: "Saved searches",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.savedSearch.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.savedSearch.count(),
      ]);
      return { rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, columns: Object.keys(rows[0] ?? {}) };
    },
  },
  verification: {
    label: "Verifications",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.verification.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.verification.count(),
      ]);
      return { rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, columns: Object.keys(rows[0] ?? {}) };
    },
  },
  review: {
    label: "Reviews",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.review.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.review.count(),
      ]);
      return { rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, columns: Object.keys(rows[0] ?? {}) };
    },
  },
  project: {
    label: "Projects",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.project.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.project.count(),
      ]);
      return { rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, columns: Object.keys(rows[0] ?? {}) };
    },
  },
  localityinsight: {
    label: "Locality insights",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.localityInsight.findMany({ skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.localityInsight.count(),
      ]);
      return { rows: rows as Record<string, unknown>[], total, columns: Object.keys(rows[0] ?? {}) };
    },
  },
  brokerprofile: {
    label: "Broker profiles",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.brokerProfile.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.brokerProfile.count(),
      ]);
      return { rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, columns: Object.keys(rows[0] ?? {}) };
    },
  },
  brokerreferral: {
    label: "Broker referrals",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.brokerReferral.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.brokerReferral.count(),
      ]);
      return { rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, columns: Object.keys(rows[0] ?? {}) };
    },
  },
  commission: {
    label: "Commissions",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.commission.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.commission.count(),
      ]);
      return { rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, columns: Object.keys(rows[0] ?? {}) };
    },
  },
  pushsubscription: {
    label: "Push subscriptions",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.pushSubscription.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.pushSubscription.count(),
      ]);
      return { rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, columns: Object.keys(rows[0] ?? {}) };
    },
  },
  otpcode: {
    label: "OTP codes",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.otpCode.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.otpCode.count(),
      ]);
      return {
        rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), expiresAt: r.expiresAt.toISOString() })),
        total,
        columns: Object.keys(rows[0] ?? {}),
      };
    },
  },
  adminauditlog: {
    label: "Admin audit log",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.adminAuditLog.count(),
      ]);
      return { rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, columns: Object.keys(rows[0] ?? {}) };
    },
  },
  performancescan: {
    label: "Performance scans",
    load: async (page) => {
      const [rows, total] = await Promise.all([
        prisma.performanceScan.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.performanceScan.count(),
      ]);
      return { rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, columns: Object.keys(rows[0] ?? {}) };
    },
  },
};

function fmtCell(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return JSON.stringify(v).slice(0, 80);
  const s = String(v);
  return s.length > 80 ? s.slice(0, 78) + "…" : s;
}

export default async function TableInspectorPage({
  params,
  searchParams,
}: {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  if (process.env.USE_DB !== "1") notFound();
  const { table } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);

  const entry = TABLE[table];
  if (!entry) notFound();

  const { rows, total, columns } = await entry.load(page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/database"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" /> All tables
      </Link>

      <SectionHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" /> {table}
          </span>
        }
        title={entry.label}
        subtitle={`Total ${total.toLocaleString("en-IN")} rows · page ${page} / ${totalPages}`}
      />

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[12px]">
            <thead className="bg-ink-50/60 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-3 py-2 whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/70">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-8 text-center text-[12.5px] text-ink-500">
                    No rows.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i} className="hover:bg-ink-50/50">
                    {columns.map((c) => (
                      <td key={c} className="px-3 py-2 align-top tabular-nums text-ink-800">
                        <code className="block max-w-[260px] truncate" title={fmtCell((r as Record<string, unknown>)[c])}>
                          {fmtCell((r as Record<string, unknown>)[c])}
                        </code>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simple prev/next pager */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/admin/database/${table}?page=${Math.max(1, page - 1)}`}
            aria-disabled={page === 1}
            className={`inline-flex h-9 items-center rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold ${page === 1 ? "pointer-events-none opacity-50" : "hover:border-brand-500/40"}`}
          >
            ← Prev
          </Link>
          <span className="text-[12px] text-ink-500">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/admin/database/${table}?page=${Math.min(totalPages, page + 1)}`}
            aria-disabled={page === totalPages}
            className={`inline-flex h-9 items-center rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold ${page === totalPages ? "pointer-events-none opacity-50" : "hover:border-brand-500/40"}`}
          >
            Next →
          </Link>
        </div>
      )}
    </div>
  );
}
