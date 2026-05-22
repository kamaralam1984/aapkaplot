import Link from "next/link";
import { Users, ListChecks, Inbox, IndianRupee, ShieldAlert, ArrowRight, Activity, LayoutDashboard, UserCheck, Megaphone } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { prisma } from "@/server/db";
import { formatInr } from "@/lib/format";

export const dynamic = "force-dynamic";

function relativeTime(d: Date) {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default async function AdminOverview() {
  if (process.env.USE_DB !== "1") {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Operations" title="Platform health" subtitle="DB-off mode" />
        <div className="surface-card p-6 text-[13.5px] text-rose-700">
          DB is disabled (USE_DB ≠ 1). Set USE_DB=1 in .env.local and rebuild to enable real stats.
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/builder" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
            <LayoutDashboard className="h-4 w-4" />Builder Dashboard<ArrowRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
          <Link href="/builder/crm" className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-[13px] font-semibold text-sky-700 hover:bg-sky-100 transition-colors">
            <UserCheck className="h-4 w-4" />Builder CRM Leads<ArrowRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
          <Link href="/admin/outreach" className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-[13px] font-semibold text-pink-700 hover:bg-pink-100 transition-colors">
            <Megaphone className="h-4 w-4" />AI Outreach<ArrowRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      </div>
    );
  }

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    weeklySignups,
    activeListings,
    pendingReview,
    leads30d,
    revenue30d,
    recentUsers,
    recentProperties,
    recentAudit,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since7d } } }),
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.property.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.lead.count({ where: { createdAt: { gte: since30d } } }),
    prisma.payment.aggregate({
      where: { status: "paid", createdAt: { gte: since30d } },
      _sum: { amountInr: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    }),
    prisma.property.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, city: true, locality: true, priceInr: true, createdAt: true },
    }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, action: true, targetType: true, targetId: true, actorEmail: true, createdAt: true },
    }),
  ]);

  const revenueInr = revenue30d._sum.amountInr ?? 0;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Operations"
        title="Platform health"
        subtitle="Live status of users, listings, leads and revenue."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={totalUsers.toLocaleString("en-IN")}
          delta={{ value: `+${weeklySignups} / wk`, direction: "up" }}
          icon={Users}
          tone="violet"
        />
        <StatCard
          label="Active listings"
          value={activeListings.toLocaleString("en-IN")}
          delta={{ value: `${pendingReview} pending review`, direction: pendingReview > 0 ? "down" : "up" }}
          icon={ListChecks}
          tone="emerald"
        />
        <StatCard
          label="Leads (30d)"
          value={leads30d.toLocaleString("en-IN")}
          icon={Inbox}
          tone="sky"
        />
        <StatCard
          label="Revenue (30d)"
          value={formatInr(revenueInr)}
          icon={IndianRupee}
          tone="amber"
        />
      </div>

      {/* Builder quick links */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/builder"
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          Builder Dashboard
          <ArrowRight className="h-3.5 w-3.5 opacity-60" />
        </Link>
        <Link
          href="/builder/crm"
          className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-[13px] font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
        >
          <UserCheck className="h-4 w-4" />
          Builder CRM Leads
          <ArrowRight className="h-3.5 w-3.5 opacity-60" />
        </Link>
        <Link
          href="/admin/revenue"
          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
        >
          <IndianRupee className="h-4 w-4" />
          Revenue
          <ArrowRight className="h-3.5 w-3.5 opacity-60" />
        </Link>
        <Link
          href="/admin/outreach"
          className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-[13px] font-semibold text-pink-700 hover:bg-pink-100 transition-colors"
        >
          <Megaphone className="h-4 w-4" />
          AI Outreach
          <ArrowRight className="h-3.5 w-3.5 opacity-60" />
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card overflow-hidden">
          <header className="flex items-center justify-between border-b border-ink-200/70 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-700">
                <ShieldAlert className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-[14px] font-bold text-ink-900">Pending review</h3>
            </div>
            <Link href="/admin/properties?status=PENDING_REVIEW" className="text-[12.5px] font-semibold text-brand-600 hover:underline">
              Review all <ArrowRight className="inline h-3 w-3" />
            </Link>
          </header>
          <ul className="divide-y divide-ink-200/70">
            {recentProperties.length === 0 && (
              <li className="px-5 py-6 text-[13px] text-ink-500 text-center">Queue empty.</li>
            )}
            {recentProperties.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink-900">{p.title}</p>
                  <p className="truncate text-[11.5px] text-ink-500">
                    {p.locality}, {p.city} · {formatInr(p.priceInr)}
                  </p>
                </div>
                <span className="text-[11.5px] text-ink-500">{relativeTime(p.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card overflow-hidden">
          <header className="flex items-center justify-between border-b border-ink-200/70 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-50 text-violet-600">
                <Users className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-[14px] font-bold text-ink-900">Recent users</h3>
            </div>
            <Link href="/admin/users" className="text-[12.5px] font-semibold text-brand-600 hover:underline">
              Manage all <ArrowRight className="inline h-3 w-3" />
            </Link>
          </header>
          <ul className="divide-y divide-ink-200/70">
            {recentUsers.length === 0 && (
              <li className="px-5 py-6 text-[13px] text-ink-500 text-center">No users yet.</li>
            )}
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-gradient text-[12px] font-bold text-white">
                  {(u.name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink-900">{u.name ?? u.email ?? "—"}</p>
                  <p className="truncate text-[11.5px] text-ink-500">{u.email ?? "—"} · {u.role}</p>
                </div>
                <span className="text-[11.5px] text-ink-500">{relativeTime(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <header className="flex items-center justify-between border-b border-ink-200/70 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-50 text-sky-700">
              <Activity className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-[14px] font-bold text-ink-900">Recent admin activity</h3>
          </div>
          <Link href="/admin/audit" className="text-[12.5px] font-semibold text-brand-600 hover:underline">
            Open audit log <ArrowRight className="inline h-3 w-3" />
          </Link>
        </header>
        <ul className="divide-y divide-ink-200/70">
          {recentAudit.length === 0 && (
            <li className="px-5 py-6 text-[13px] text-ink-500 text-center">
              No admin activity yet — start moderating from /admin/properties.
            </li>
          )}
          {recentAudit.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-5 py-3 text-[12.5px]">
              <span className="font-mono text-ink-700">{a.action}</span>
              <span className="text-ink-500">on</span>
              <span className="font-mono text-ink-700">{a.targetType}:{a.targetId.slice(0, 12)}…</span>
              <span className="ml-auto text-ink-500">
                {a.actorEmail ?? "—"} · {relativeTime(a.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
