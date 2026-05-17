"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Users, MapPin } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { DashboardEmpty } from "@/components/dashboard/DashboardEmpty";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Referral {
  id: string;
  status: string;
  commissionPct: number;
  expectedCommissionInr: number;
  createdAt: string;
  buyer: { name: string; phone: string };
  property: { id: string; title: string; coverUrl: string; priceInr: number; city: string; locality: string };
}

const STATUS_STYLE: Record<string, string> = {
  pending:        "bg-amber-50 text-amber-700",
  offer_accepted: "bg-emerald-50 text-emerald-700",
  closed:         "bg-violet-50 text-violet-700",
  lost:           "bg-rose-50 text-rose-700",
  expired:        "bg-ink-100 text-ink-700",
};

export default function ReferralsPage() {
  const [items, setItems] = useState<Referral[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/broker/refer", { cache: "no-store" });
        const data = await res.json();
        setItems(data.referrals ?? []);
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
        eyebrow="Pipeline"
        title="Your referrals"
        subtitle="Track each buyer you've introduced. Status flips to 'offer_accepted' the moment the seller agrees — that's when commission gets booked."
      />
      {items.length === 0 ? (
        <DashboardEmpty
          icon={Users}
          title="No referrals yet"
          body="Head to the marketplace and refer your first buyer."
          action={
            <Link href="/broker/marketplace" className="inline-flex h-10 items-center rounded-xl bg-brand-gradient px-4 text-[13px] font-bold text-white shadow-glow">
              Browse marketplace
            </Link>
          }
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <ul className="divide-y divide-ink-200/70">
            {items.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                <Link href={`/property/${r.property.id}`} className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                  <Image src={r.property.coverUrl} alt={r.property.title} fill sizes="96px" className="object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-ink-900">{r.property.title}</p>
                  <p className="inline-flex items-center gap-1 text-[11.5px] text-ink-500">
                    <MapPin className="h-3 w-3 text-brand-500" /> {r.property.locality}, {r.property.city}
                  </p>
                  <p className="mt-1 text-[12px] text-ink-500">
                    Buyer: <span className="font-semibold text-ink-700">{r.buyer.name}</span> · {r.buyer.phone}
                  </p>
                </div>
                <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider",
                    STATUS_STYLE[r.status] ?? "bg-ink-100 text-ink-700"
                  )}>
                    {r.status.replace("_", " ")}
                  </span>
                  <p className="text-[13px] font-bold text-violet-700">
                    {formatInr(r.expectedCommissionInr)}{" "}
                    <span className="text-[10.5px] font-normal text-ink-500">@ {r.commissionPct}%</span>
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
