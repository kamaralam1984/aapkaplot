import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, IndianRupee, CheckCircle2, ArrowRight, Search } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { formatInr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BrokerOverviewPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/broker");

  if (process.env.USE_DB !== "1") {
    return <DbDisabled />;
  }

  const profile = await prisma.brokerProfile.findUnique({ where: { userId: session.uid } });
  if (!profile) redirect("/broker/signup");

  const [referrals, agg] = await Promise.all([
    prisma.brokerReferral.findMany({
      where: { brokerId: session.uid },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { property: { select: { title: true, city: true, priceInr: true } } },
    }),
    prisma.commission.groupBy({
      by: ["status"],
      where: { brokerId: session.uid },
      _sum: { amountInr: true },
      _count: { _all: true },
    }),
  ]);

  const totals = { pending: 0, approved: 0, paid: 0, count: 0 };
  for (const a of agg) {
    if (a.status === "pending")  totals.pending  = a._sum.amountInr ?? 0;
    if (a.status === "approved") totals.approved = a._sum.amountInr ?? 0;
    if (a.status === "paid")     totals.paid     = a._sum.amountInr ?? 0;
    totals.count += a._count._all;
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow={profile.reraVerified ? "RERA verified broker" : "Welcome back"}
        title={`Hello, ${profile.agencyName} 👋`}
        subtitle="Bring buyers to broker-friendly listings and earn commission on accepted offers."
        actions={
          <Link href="/broker/marketplace">
            <Button variant="primary" size="md" iconLeft={<Search className="h-4 w-4" />}>
              Browse marketplace
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active referrals" value={referrals.length} icon={Users} tone="sky" />
        <StatCard label="Pending payouts" value={formatInr(totals.pending)} icon={IndianRupee} tone="amber" />
        <StatCard label="Approved (not paid)" value={formatInr(totals.approved)} icon={IndianRupee} tone="violet" />
        <StatCard label="Lifetime paid" value={formatInr(totals.paid)} icon={CheckCircle2} tone="emerald" />
      </div>

      <section className="surface-card overflow-hidden">
        <header className="flex items-center justify-between border-b border-ink-200/70 bg-white/60 px-5 py-3">
          <h2 className="text-[14px] font-bold text-ink-900">Recent referrals</h2>
          <Link href="/broker/referrals" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-700 hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </header>
        {referrals.length === 0 ? (
          <p className="px-5 py-10 text-center text-ink-500">
            No referrals yet — pick a property from the marketplace to start.
          </p>
        ) : (
          <ul className="divide-y divide-ink-200/70">
            {referrals.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[13.5px]">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900">{r.property.title}</p>
                  <p className="text-[12px] text-ink-500">
                    {r.property.city} · {formatInr(r.property.priceInr)} listing
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  {r.status}
                </span>
                <span className="text-[12.5px] font-bold text-emerald-700">
                  {formatInr(r.expectedCommissionInr)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DbDisabled() {
  return (
    <div className="surface-card grid place-items-center p-12 text-center">
      <p className="text-display-md font-display text-ink-900">Broker panel needs DB</p>
      <p className="mt-2 max-w-md text-[13.5px] text-ink-500">
        Set <code>USE_DB=1</code> and restart the app — broker tooling is DB-backed.
      </p>
    </div>
  );
}
