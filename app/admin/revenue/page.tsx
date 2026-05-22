import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { IndianRupee, Users, CreditCard, XCircle } from "lucide-react";
import { prisma } from "@/server/db";
import { formatInr } from "@/lib/format";

export const dynamic = "force-dynamic";

// ── Mock data shown when USE_DB is off ──────────────────────────────────────
const MOCK_STATS = {
  mrr: 123456,
  subscribers: 14,
  thisMonthPayments: 89750,
  pendingCancellations: 2,
};

const MOCK_SUBS = [
  { id: "1", email: "rajan@example.com", tier: "DOMINATOR", status: "ACTIVE", currentPeriodEnd: new Date("2026-06-19"), lifetimePaidPaise: 4999900 },
  { id: "2", email: "sharma@example.com", tier: "GROWTH", status: "ACTIVE", currentPeriodEnd: new Date("2026-06-14"), lifetimePaidPaise: 1999800 },
  { id: "3", email: "bihartownship@example.com", tier: "STARTER", status: "ACTIVE", currentPeriodEnd: new Date("2026-06-10"), lifetimePaidPaise: 299900 },
  { id: "4", email: "priya@example.com", tier: "GROWTH", status: "CANCELLED", currentPeriodEnd: new Date("2026-05-31"), lifetimePaidPaise: 999900 },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
const TIER_STYLES: Record<string, string> = {
  DOMINATOR: "bg-amber-100 text-amber-700",
  GROWTH: "bg-emerald-100 text-emerald-700",
  STARTER: "bg-blue-100 text-blue-700",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-600",
  PAUSED: "bg-yellow-50 text-yellow-600",
  CANCELLED: "bg-rose-50 text-rose-600",
  EXPIRED: "bg-zinc-100 text-zinc-500",
};

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Page ────────────────────────────────────────────────────────────────────
export default async function AdminRevenuePage() {
  if (process.env.USE_DB !== "1") {
    return (
      <div className="space-y-8">
        <SectionHeader
          eyebrow="Finance"
          title="Revenue"
          subtitle="Builder subscription revenue — mock data (USE_DB=1 for live)"
        />

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total MRR" value={formatInr(MOCK_STATS.mrr)} icon={IndianRupee} tone="emerald" />
          <StatCard label="Active Subscribers" value={String(MOCK_STATS.subscribers)} icon={Users} tone="sky" />
          <StatCard label="This Month's Payments" value={formatInr(MOCK_STATS.thisMonthPayments)} icon={CreditCard} tone="violet" />
          <StatCard label="Pending Cancellations" value={String(MOCK_STATS.pendingCancellations)} icon={XCircle} tone="rose" />
        </div>

        {/* Subscriptions table */}
        <SubscriptionsTable rows={MOCK_SUBS} />
      </div>
    );
  }

  // ── Live DB ────────────────────────────────────────────────────────────────
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [subs, thisMonthAgg] = await Promise.all([
    prisma.builderSubscription.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tier: true,
        status: true,
        currentPeriodEnd: true,
        lifetimePaidPaise: true,
        amountPaise: true,
        cancelledAt: true,
        user: { select: { email: true } },
      },
    }),
    prisma.builderPayment.aggregate({
      where: { status: "paid", createdAt: { gte: since30d } },
      _sum: { amountPaise: true },
    }),
  ]);

  const activeSubs = subs.filter((s) => s.status === "ACTIVE");
  const mrr = activeSubs.reduce((sum, s) => sum + s.amountPaise, 0);
  const thisMonthPayments = thisMonthAgg._sum.amountPaise ?? 0;
  const pendingCancellations = subs.filter((s) => s.status === "PAUSED").length;

  const rows = subs.map((s) => ({
    id: s.id,
    email: s.user.email ?? "—",
    tier: s.tier,
    status: s.status,
    currentPeriodEnd: s.currentPeriodEnd,
    lifetimePaidPaise: s.lifetimePaidPaise,
  }));

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Finance"
        title="Revenue"
        subtitle="Builder subscription MRR and payment history."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total MRR" value={formatInr(Math.round(mrr / 100))} icon={IndianRupee} tone="emerald" />
        <StatCard label="Active Subscribers" value={String(activeSubs.length)} icon={Users} tone="sky" />
        <StatCard label="This Month's Payments" value={formatInr(Math.round(thisMonthPayments / 100))} icon={CreditCard} tone="violet" />
        <StatCard label="Pending Cancellations" value={String(pendingCancellations)} icon={XCircle} tone="rose" />
      </div>

      <SubscriptionsTable rows={rows} />
    </div>
  );
}

// ── Table sub-component ──────────────────────────────────────────────────────
function SubscriptionsTable({
  rows,
}: {
  rows: {
    id: string;
    email: string;
    tier: string;
    status: string;
    currentPeriodEnd: Date;
    lifetimePaidPaise: number;
  }[];
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h3 className="text-sm font-semibold text-zinc-800">All Subscriptions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs text-zinc-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Plan</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Renews</th>
              <th className="px-5 py-3 font-medium text-right">Lifetime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50/60 transition-colors">
                <td className="px-5 py-3 text-zinc-800 font-medium">{r.email}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${TIER_STYLES[r.tier] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    {r.tier}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_STYLES[r.status] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-zinc-500">{formatDate(r.currentPeriodEnd)}</td>
                <td className="px-5 py-3 text-right font-semibold text-zinc-800">
                  ₹{(r.lifetimePaidPaise / 100).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-zinc-400 text-sm">
                  No subscriptions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
