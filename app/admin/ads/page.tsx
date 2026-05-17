import { Megaphone, Plus, IndianRupee } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { formatInr } from "@/lib/format";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

const dayMs = 24 * 60 * 60 * 1000;

/**
 * Ads & promotions admin.
 *
 * AapKaPlot's revenue today comes from listing boosts/features (the Payment
 * model), not display ad campaigns — there is no Ad/Campaign table in the
 * schema yet. So this page surfaces the real billing data we DO have:
 * paid boosts/features over the last 30 days, with totals + a per-plan
 * breakdown. When a dedicated Ad/Campaign model is added later, the table
 * below can be swapped to query it instead.
 */
async function loadPaidBoosts() {
  if (process.env.USE_DB !== "1") return null;
  const since = new Date(Date.now() - 30 * dayMs);
  const rows = await prisma.payment.findMany({
    where: { status: "paid", createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      plan: true,
      amountInr: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      property: { select: { id: true, title: true } },
    },
  });
  const totalSpend = rows.reduce((acc, r) => acc + r.amountInr, 0);
  const planMap = new Map<string, { count: number; spend: number }>();
  for (const r of rows) {
    const cur = planMap.get(r.plan) ?? { count: 0, spend: 0 };
    cur.count += 1;
    cur.spend += r.amountInr;
    planMap.set(r.plan, cur);
  }
  const byPlan = [...planMap.entries()]
    .map(([plan, v]) => ({ plan, ...v }))
    .sort((a, b) => b.spend - a.spend);

  return { rows, totalSpend, byPlan };
}

export default async function AdminAdsPage() {
  const data = await loadPaidBoosts();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Revenue"
        title="Ads &amp; promotions"
        subtitle="Paid listing boosts &amp; feature placements (Payment table, last 30 days). Display-ad campaigns coming when the Ad model is added."
        actions={
          <Button variant="primary" size="md" iconLeft={<Plus className="h-4 w-4" />} disabled>
            New campaign
          </Button>
        }
      />

      {!data ? (
        <div className="surface-card p-6 text-[13.5px] text-rose-700">
          DB is disabled (<code>USE_DB ≠ 1</code>). Revenue data unavailable.
        </div>
      ) : (
        <>
          {/* KPI tiles */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard tone="emerald" label="Revenue (30d)" value={formatInr(data.totalSpend)} helper="paid boosts + features" />
            <KpiCard tone="sky"     label="Transactions"  value={data.rows.length.toString()} helper="completed in 30d" />
            <KpiCard tone="violet"  label="Active plans"  value={data.byPlan.length.toString()} helper="distinct plans purchased" />
            <KpiCard tone="amber"   label="Avg ticket"    value={data.rows.length ? formatInr(Math.round(data.totalSpend / data.rows.length)) : "—"} helper="₹ per transaction" />
          </div>

          {/* Per-plan breakdown */}
          {data.byPlan.length > 0 && (
            <div className="surface-card overflow-hidden">
              <header className="border-b border-ink-200/70 px-5 py-3">
                <h3 className="text-[14px] font-bold text-ink-900">By plan (30d)</h3>
              </header>
              <ul className="divide-y divide-ink-200/70">
                {data.byPlan.map((p) => (
                  <li key={p.plan} className="flex items-center gap-3 px-5 py-3 text-[13.5px]">
                    <Megaphone className="h-4 w-4 text-brand-500" />
                    <span className="font-bold text-ink-900">{p.plan}</span>
                    <span className="ml-auto text-ink-700">{p.count}× · {formatInr(p.spend)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent transactions table */}
          <div className="surface-card overflow-hidden">
            <header className="border-b border-ink-200/70 px-5 py-3">
              <h3 className="text-[14px] font-bold text-ink-900">Recent transactions</h3>
            </header>
            {data.rows.length === 0 ? (
              <div className="grid place-items-center gap-2 px-5 py-12 text-center text-ink-500">
                <IndianRupee className="h-7 w-7 text-ink-300" />
                <p className="text-[14px] font-semibold text-ink-800">No paid campaigns yet.</p>
                <p className="text-[12px]">
                  Buyers/sellers haven&apos;t purchased boosts or features in the last 30 days. Real revenue data will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="bg-ink-50/50 text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
                    <tr>
                      <th className="px-5 py-3">Listing / customer</th>
                      <th className="px-3 py-3">Plan</th>
                      <th className="px-3 py-3">Amount</th>
                      <th className="px-3 py-3">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200/70">
                    {data.rows.map((r) => (
                      <tr key={r.id} className="text-[13.5px] hover:bg-ink-50/50">
                        <td className="px-5 py-3 font-bold text-ink-900">
                          <Megaphone className="mr-2 inline h-4 w-4 text-brand-500" />
                          {r.property?.title ?? r.user?.name ?? r.user?.email ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-ink-700">{r.plan}</td>
                        <td className="px-3 py-3 font-semibold text-ink-900">{formatInr(r.amountInr)}</td>
                        <td className="px-3 py-3 text-ink-500">{r.createdAt.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, helper, tone }: { label: string; value: string; helper: string; tone: "emerald" | "rose" | "amber" | "violet" | "sky" }) {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
    sky: "bg-sky-50 text-sky-700",
  };
  return (
    <div className="surface-card p-5">
      <span className={`inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-semibold ${toneMap[tone]}`}>
        {label}
      </span>
      <p className="mt-2.5 text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-[12px] text-ink-500">{helper}</p>
    </div>
  );
}
