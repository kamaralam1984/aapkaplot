"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, IndianRupee, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardEmpty } from "@/components/dashboard/DashboardEmpty";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Commission {
  id: string;
  amountInr: number;
  status: string;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
  property: { id: string; title: string; coverUrl: string; city: string };
  buyer: { name: string; phone: string };
}

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700",
  approved:  "bg-violet-50 text-violet-700",
  paid:      "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export default function CommissionsPage() {
  const [items, setItems] = useState<Commission[] | null>(null);
  const [totals, setTotals] = useState({ pending: 0, approved: 0, paid: 0 });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/broker/commissions", { cache: "no-store" });
        const data = await res.json();
        setItems(data.commissions ?? []);
        setTotals(data.totals ?? { pending: 0, approved: 0, paid: 0 });
      } catch {
        setItems([]);
      }
    })();
  }, []);

  if (items === null) {
    return (
      <div className="flex h-48 items-center justify-center text-ink-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Earnings"
        title="Commissions"
        subtitle="Auto-created the moment a seller accepts an offer from a buyer you referred. Approval → payout happens monthly."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={formatInr(totals.pending)}  icon={IndianRupee} tone="amber" />
        <StatCard label="Approved" value={formatInr(totals.approved)} icon={IndianRupee} tone="violet" />
        <StatCard label="Paid"     value={formatInr(totals.paid)}     icon={CheckCircle2} tone="emerald" />
      </div>

      {items.length === 0 ? (
        <DashboardEmpty
          icon={IndianRupee}
          title="No commissions yet"
          body="Once a buyer you referred has their offer accepted, the commission appears here."
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <ul className="divide-y divide-ink-200/70">
            {items.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                <Link href={`/property/${c.property.id}`} className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                  <Image src={c.property.coverUrl} alt={c.property.title} fill sizes="80px" className="object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-ink-900">{c.property.title}</p>
                  <p className="text-[11.5px] text-ink-500">
                    {c.property.city} · buyer {c.buyer.name}
                  </p>
                  <p className="text-[11px] text-ink-400">
                    Booked {new Date(c.createdAt).toLocaleDateString("en-IN")}
                    {c.paidAt && ` · Paid ${new Date(c.paidAt).toLocaleDateString("en-IN")}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider",
                    STATUS_STYLE[c.status] ?? "bg-ink-100 text-ink-700"
                  )}>
                    {c.status}
                  </span>
                  <p className="text-[14px] font-bold text-emerald-700">
                    {formatInr(c.amountInr)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
