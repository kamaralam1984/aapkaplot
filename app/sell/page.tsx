import Link from "next/link";
import Image from "next/image";
import { Eye, Inbox, ListChecks, IndianRupee, ArrowRight, Plus } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { MOCK_SELLER_LISTINGS, MOCK_LEADS, getPropertyById } from "@/lib/mock-dashboard";
import { formatInr } from "@/lib/format";

const STATUS_STYLE = {
  active:          "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  pending_review:  "bg-amber-50 text-amber-700 border-amber-200/70",
  paused:          "bg-ink-100 text-ink-700 border-ink-200",
  draft:           "bg-ink-100 text-ink-700 border-ink-200",
  sold:            "bg-sky-50 text-sky-700 border-sky-200/70",
  rejected:        "bg-rose-50 text-rose-700 border-rose-200/70",
} as const;

export default function SellerOverviewPage() {
  const totalViews = MOCK_SELLER_LISTINGS.reduce((s, l) => s + l.views, 0);
  const totalLeads = MOCK_LEADS.length;
  const newLeads = MOCK_LEADS.filter((l) => l.status === "new").length;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Seller hub"
        title="Manage your listings"
        subtitle="Track views, qualify leads, and boost performance across all your properties."
        actions={
          <Link href="/sell/new">
            <Button variant="primary" size="md" iconLeft={<Plus className="h-4 w-4" />}>
              Post a property
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active listings" value={MOCK_SELLER_LISTINGS.filter((l) => l.status === "active").length} icon={ListChecks} tone="emerald" />
        <StatCard label="Views this month" value={totalViews.toLocaleString("en-IN")} delta={{ value: "+18%", direction: "up" }} icon={Eye} tone="sky" />
        <StatCard label="New leads" value={newLeads} delta={{ value: `${totalLeads} total`, direction: "up" }} icon={Inbox} tone="amber" />
        <StatCard label="Est. revenue" value={formatInr(35_50_000)} delta={{ value: "Pipeline this Q", direction: "up" }} icon={IndianRupee} tone="violet" />
      </div>

      <section className="surface-card overflow-hidden">
        <header className="flex items-center justify-between border-b border-ink-200/70 px-5 py-3.5">
          <h2 className="text-[14px] font-bold text-ink-900">Recent listings</h2>
          <Link href="/sell/listings" className="text-[12.5px] font-semibold text-brand-600 hover:underline">
            Manage all →
          </Link>
        </header>
        <ul className="divide-y divide-ink-200/70">
          {MOCK_SELLER_LISTINGS.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-5 py-3.5">
              <Link href={`/property/${p.id}`} className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                <Image src={p.media.cover} alt={p.title} fill sizes="80px" className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/property/${p.id}`} className="block truncate text-[13.5px] font-bold text-ink-900 hover:underline">
                  {p.title}
                </Link>
                <p className="truncate text-[12px] text-ink-500">
                  {p.location.locality}, {p.location.city} · {formatInr(p.priceInr)}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">Views</p>
                <p className="text-[13px] font-bold text-ink-900">{p.views.toLocaleString("en-IN")}</p>
              </div>
              <div className="hidden text-right md:block">
                <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">Leads</p>
                <p className="text-[13px] font-bold text-ink-900">{p.leadsCount}</p>
              </div>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[p.status]}`}>
                {p.status.replace("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent leads */}
      <section className="surface-card overflow-hidden">
        <header className="flex items-center justify-between border-b border-ink-200/70 px-5 py-3.5">
          <h2 className="text-[14px] font-bold text-ink-900">Latest leads</h2>
          <Link href="/sell/leads" className="text-[12.5px] font-semibold text-brand-600 hover:underline">
            View all leads →
          </Link>
        </header>
        <ul className="divide-y divide-ink-200/70">
          {MOCK_LEADS.slice(0, 4).map((l) => {
            const p = getPropertyById(l.propertyId);
            return (
              <li key={l.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gradient text-[12px] font-bold text-white">
                  {l.buyerName.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink-900">{l.buyerName} <span className="font-normal text-ink-500">on</span> <Link href={`/property/${l.propertyId}`} className="hover:underline">{p?.title}</Link></p>
                  <p className="truncate text-[12px] text-ink-500">"{l.message}"</p>
                </div>
                <Link href="/sell/leads" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-600 hover:underline">
                  Respond <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
