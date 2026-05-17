import Link from "next/link";
import { Database, ChevronRight, Layers } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

/**
 * Live row-count grid for every Prisma model. Lets a super admin
 * eyeball the state of the data layer at a glance: how many users
 * signed up, how many properties are pending review, how many leads
 * are in flight, etc.
 *
 * Each tile links into /admin/database/[table] for the actual rows.
 */
const TABLES: { key: string; label: string; count: () => Promise<number> }[] = [
  { key: "user",            label: "Users",            count: () => prisma.user.count() },
  { key: "property",        label: "Properties",       count: () => prisma.property.count() },
  { key: "lead",            label: "Leads",            count: () => prisma.lead.count() },
  { key: "message",         label: "Messages",         count: () => prisma.message.count() },
  { key: "payment",         label: "Payments",         count: () => prisma.payment.count() },
  { key: "favorite",        label: "Favorites",        count: () => prisma.favorite.count() },
  { key: "visitrequest",    label: "Visit requests",   count: () => prisma.visitRequest.count() },
  { key: "savedsearch",     label: "Saved searches",   count: () => prisma.savedSearch.count() },
  { key: "verification",    label: "Verifications",    count: () => prisma.verification.count() },
  { key: "review",          label: "Reviews",          count: () => prisma.review.count() },
  { key: "project",         label: "Projects",         count: () => prisma.project.count() },
  { key: "localityinsight", label: "Locality insights", count: () => prisma.localityInsight.count() },
  { key: "brokerprofile",   label: "Broker profiles",  count: () => prisma.brokerProfile.count() },
  { key: "brokerreferral",  label: "Broker referrals", count: () => prisma.brokerReferral.count() },
  { key: "commission",      label: "Commissions",      count: () => prisma.commission.count() },
  { key: "pushsubscription", label: "Push subs",       count: () => prisma.pushSubscription.count() },
  { key: "otpcode",         label: "OTP codes",        count: () => prisma.otpCode.count() },
  { key: "adminauditlog",   label: "Admin audit log",  count: () => prisma.adminAuditLog.count() },
  { key: "performancescan", label: "Performance scans", count: () => prisma.performanceScan.count() },
];

export default async function DatabaseOverviewPage() {
  if (process.env.USE_DB !== "1") {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Data layer" title="Database" subtitle="DB is off (USE_DB ≠ 1)." />
        <div className="surface-card p-6 text-[13.5px] text-rose-700">
          The database is disabled in this environment. Set <code>USE_DB=1</code> to view tables.
        </div>
      </div>
    );
  }

  const counts = await Promise.all(
    TABLES.map(async (t) => ({ ...t, total: await t.count().catch(() => -1) })),
  );
  const grandTotal = counts.reduce((a, b) => a + Math.max(0, b.total), 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Data layer"
        title="Database"
        subtitle={`Live row counts across all ${TABLES.length} Prisma models. Click a tile to inspect rows.`}
      />

      {/* Grand totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          tone="violet"
          icon={<Database className="h-4 w-4" />}
          label="Total rows (all tables)"
          value={grandTotal.toLocaleString("en-IN")}
        />
        <StatTile
          tone="emerald"
          icon={<Layers className="h-4 w-4" />}
          label="Tables tracked"
          value={TABLES.length.toString()}
        />
        <StatTile
          tone="amber"
          icon={<Database className="h-4 w-4" />}
          label="Active properties"
          value={(counts.find((c) => c.key === "property")?.total ?? 0).toLocaleString("en-IN")}
        />
      </div>

      {/* Tables grid */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {counts
          .slice()
          .sort((a, b) => b.total - a.total)
          .map((t) => (
            <li key={t.key}>
              <Link
                href={`/admin/database/${t.key}`}
                className="surface-card group flex items-center gap-3 p-4 transition hover:border-brand-500/40 hover:shadow-lift"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink-100 text-ink-700 group-hover:bg-brand-50 group-hover:text-brand-700">
                  <Database className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-ink-900">{t.label}</p>
                  <p className="truncate text-[11.5px] text-ink-500">
                    Prisma model: <code>{t.key}</code>
                  </p>
                </div>
                <span className="tabular-nums text-[15px] font-bold text-ink-900">
                  {t.total < 0 ? "—" : t.total.toLocaleString("en-IN")}
                </span>
                <ChevronRight className="h-4 w-4 text-ink-400" />
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}

function StatTile({
  tone, icon, label, value,
}: {
  tone: "emerald" | "violet" | "amber";
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const map = {
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  } as const;
  return (
    <div className="surface-card p-5">
      <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold ${map[tone]}`}>
        {icon}
        {label}
      </span>
      <p className="mt-2.5 text-3xl font-bold text-ink-900 tabular-nums">{value}</p>
    </div>
  );
}
