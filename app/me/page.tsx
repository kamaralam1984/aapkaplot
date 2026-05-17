import Link from "next/link";
import { Heart, CalendarDays, BellRing, Sparkles, ArrowRight, Search } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { RecommendedForYou } from "@/components/dashboard/RecommendedForYou";
import { MOCK_VISITS, MOCK_SEARCH_ALERTS, getPropertyById } from "@/lib/mock-dashboard";
import { getSession } from "@/lib/auth-server";

export default async function BuyerOverviewPage() {
  const session = await getSession();

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Welcome back"
        title={`Hello, ${session?.name ?? "there"} 👋`}
        subtitle="Here's what's happening with your property search today."
        actions={
          <Link href="/search">
            <Button variant="primary" size="md" iconLeft={<Search className="h-4 w-4" />}>
              Continue searching
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saved" value="0" helper="Tap ♥ to save" icon={Heart} tone="rose" />
        <StatCard label="Visits" value={MOCK_VISITS.length} delta={{ value: "+1 this week", direction: "up" }} icon={CalendarDays} tone="sky" />
        <StatCard label="Active alerts" value={MOCK_SEARCH_ALERTS.length} delta={{ value: "12 new matches", direction: "up" }} icon={BellRing} tone="amber" />
        <StatCard label="AI picks" value="8" helper="Updated 5 min ago" icon={Sparkles} tone="emerald" />
      </div>

      {/* Recommended — client component, recomputes distance from real device coords */}
      <RecommendedForYou />

      {/* Two-col: visits + alerts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <UpcomingVisits />
        <ActiveAlerts />
      </section>
    </div>
  );
}

function UpcomingVisits() {
  const upcoming = MOCK_VISITS.filter((v) => v.status !== "completed" && v.status !== "cancelled").slice(0, 3);
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-ink-900">Upcoming visits</h3>
        <Link href="/me/visits" className="text-[12.5px] font-semibold text-brand-600 hover:underline">
          View all
        </Link>
      </div>
      <ul className="mt-3 space-y-2.5">
        {upcoming.map((v) => {
          const p = getPropertyById(v.propertyId);
          if (!p) return null;
          return (
            <li
              key={v.id}
              className="flex items-center justify-between rounded-xl border border-ink-200/70 bg-white p-3"
            >
              <div className="min-w-0">
                <Link
                  href={`/property/${p.id}`}
                  className="block truncate text-[13.5px] font-semibold text-ink-900 hover:underline"
                >
                  {p.title}
                </Link>
                <p className="text-[12px] text-ink-500">
                  {new Date(v.scheduledFor).toLocaleString("en-IN", {
                    weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  v.status === "confirmed"
                    ? "bg-emerald-50 text-emerald-700"
                    : v.status === "pending"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-ink-100 text-ink-700"
                }`}
              >
                {v.status}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ActiveAlerts() {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-ink-900">Active alerts</h3>
        <Link href="/me/alerts" className="text-[12.5px] font-semibold text-brand-600 hover:underline">
          Manage
        </Link>
      </div>
      <ul className="mt-3 space-y-2.5">
        {MOCK_SEARCH_ALERTS.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-ink-200/70 bg-white p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-ink-900">{a.label}</p>
              <p className="truncate text-[12px] text-ink-500">{a.filtersDescription}</p>
            </div>
            <Link
              href={a.url}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand-700 hover:bg-brand-100"
            >
              {a.newCount} new
              <ArrowRight className="h-3 w-3" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
