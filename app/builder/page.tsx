import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, CreditCard, TrendingUp, ArrowRight, Star } from "lucide-react";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";

export const dynamic = "force-dynamic";

export default async function BuilderOverviewPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/builder");

  const useDb = process.env.USE_DB === "1";

  let totalLeads = 0;
  let newLeads = 0;
  let tier = "Free";

  if (useDb) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [leadCount, newCount, sub] = await Promise.all([
        prisma.lead.count({ where: { toUserId: session.uid } }),
        prisma.lead.count({ where: { toUserId: session.uid, createdAt: { gte: today } } }),
        prisma.builderSubscription.findFirst({
          where: { userId: session.uid, status: "ACTIVE" },
          select: { tier: true },
        }),
      ]);

      totalLeads = leadCount;
      newLeads = newCount;
      tier = sub?.tier ?? "Free";
    } catch { /* non-fatal */ }
  } else {
    totalLeads = 6;
    newLeads = 2;
    tier = "Free";
  }

  const QUICK_ACTIONS = [
    {
      href: "/builder/crm",
      icon: Users,
      title: "Lead CRM",
      desc: "View, score, and contact buyers who inquired about your listings.",
      color: "bg-sky-50 border-sky-200 hover:bg-sky-100",
      iconColor: "text-sky-600",
    },
    {
      href: "/builder/subscribe",
      icon: CreditCard,
      title: "Upgrade Plan",
      desc: "Unlock more leads, featured listings, and site visit requests.",
      color: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      href: "/pricing",
      icon: Star,
      title: "View Pricing",
      desc: "Compare Starter, Growth, and Dominator plans.",
      color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow={`Builder Dashboard · ${tier} plan`}
        title={`Welcome back${session.name ? ", " + session.name.split(" ")[0] : ""}!`}
        subtitle="Manage your listings, track leads, and grow your builder business."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Leads"   value={totalLeads} icon={Users}      tone="sky" />
        <StatCard label="New Today"     value={newLeads}   icon={TrendingUp}  tone="amber" />
        <StatCard label="Current Plan"  value={tier}       icon={Star}        tone="emerald" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-ink-500">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`group flex flex-col gap-3 rounded-xl border p-5 transition-colors ${a.color}`}
            >
              <div className={`w-fit rounded-lg bg-white p-2 shadow-sm ${a.iconColor}`}>
                <a.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink-900">{a.title}</p>
                <p className="mt-0.5 text-[12px] text-ink-500">{a.desc}</p>
              </div>
              <div className={`mt-auto flex items-center gap-1 text-[12px] font-semibold ${a.iconColor}`}>
                Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {!useDb && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <strong>Demo mode</strong> — showing mock stats. Set <code className="rounded bg-amber-100 px-1">USE_DB=1</code> to see live data.
        </div>
      )}
    </div>
  );
}
