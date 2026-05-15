import Link from "next/link";
import { Users, ListChecks, Inbox, IndianRupee, ShieldAlert, ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  MOCK_ADMIN_KPIS, MOCK_MODERATION, MOCK_USERS, getPropertyById,
} from "@/lib/mock-dashboard";
import { formatInr, formatRelativeTime } from "@/lib/format";

export default function AdminOverview() {
  const recentMod = MOCK_MODERATION.slice(0, 4);
  const recentUsers = MOCK_USERS.slice(0, 5);

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Operations"
        title="Platform health"
        subtitle="Live status of users, listings, leads and revenue."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users"  value={MOCK_ADMIN_KPIS.totalUsers.toLocaleString("en-IN")} delta={{ value: `+${MOCK_ADMIN_KPIS.weeklySignups} / wk`, direction: "up" }} icon={Users} tone="violet" />
        <StatCard label="Active listings" value={MOCK_ADMIN_KPIS.activeListings.toLocaleString("en-IN")} delta={{ value: "+312 this week", direction: "up" }} icon={ListChecks} tone="emerald" />
        <StatCard label="Leads (30d)"  value={MOCK_ADMIN_KPIS.monthlyLeads.toLocaleString("en-IN")} delta={{ value: "+14%", direction: "up" }} icon={Inbox} tone="sky" />
        <StatCard label="Revenue (30d)" value={formatInr(MOCK_ADMIN_KPIS.monthlyRevenueInr)} delta={{ value: "+22%", direction: "up" }} icon={IndianRupee} tone="amber" />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card overflow-hidden">
          <header className="flex items-center justify-between border-b border-ink-200/70 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-600">
                <ShieldAlert className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-[14px] font-bold text-ink-900">Moderation queue</h3>
            </div>
            <Link href="/admin/moderation" className="text-[12.5px] font-semibold text-brand-600 hover:underline">
              Review all <ArrowRight className="inline h-3 w-3" />
            </Link>
          </header>
          <ul className="divide-y divide-ink-200/70">
            {recentMod.map((m) => {
              const p = getPropertyById(m.propertyId);
              return (
                <li key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink-900">{p?.title ?? m.propertyId}</p>
                    <p className="text-[11.5px] text-ink-500">{m.reason} · {formatRelativeTime(m.createdAt)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    m.severity === "high"
                      ? "bg-rose-50 text-rose-700"
                      : m.severity === "medium"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-ink-100 text-ink-700"
                  }`}>
                    {m.severity}
                  </span>
                </li>
              );
            })}
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
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-gradient text-[12px] font-bold text-white">
                  {u.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink-900">{u.name}</p>
                  <p className="truncate text-[11.5px] text-ink-500">{u.phone} · {u.role}</p>
                </div>
                <span className="text-[11.5px] text-ink-500">{formatRelativeTime(u.joinedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
