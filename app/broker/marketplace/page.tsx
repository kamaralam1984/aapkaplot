"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Loader2, Handshake, Search, X } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { DashboardEmpty } from "@/components/dashboard/DashboardEmpty";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatInr } from "@/lib/format";

interface MarketProperty {
  id: string;
  title: string;
  kind: string;
  priceInr: number;
  areaSqft: number;
  bhk: number | null;
  locality: string;
  city: string;
  coverUrl: string;
  effectiveCommissionPct: number;
}

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketProperty[] | null>(null);
  const [defaultPct, setDefaultPct] = useState(1);
  const [referFor, setReferFor] = useState<MarketProperty | null>(null);
  const [city, setCity] = useState("");
  const toast = useToast();

  const load = async () => {
    setItems(null);
    try {
      const url = city ? `/api/broker/marketplace?city=${encodeURIComponent(city)}` : "/api/broker/marketplace";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setItems([]);
        return;
      }
      setItems(data.properties ?? []);
      setDefaultPct(data.defaultCommissionPct ?? 1);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Marketplace"
        title="Listings open to broker referrals"
        subtitle={`Default commission: ${defaultPct}% (some listings override). You earn on offer-accepted.`}
        actions={
          <form
            onSubmit={(e) => { e.preventDefault(); load(); }}
            className="flex gap-2"
          >
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Filter by city"
              className="h-10 w-44 rounded-xl border border-ink-200 bg-white px-3 text-[13px] focus:border-brand-500 focus:outline-none"
            />
            <Button variant="primary" size="md" type="submit" iconLeft={<Search className="h-4 w-4" />}>
              Apply
            </Button>
          </form>
        }
      />

      {items === null ? (
        <div className="flex h-32 items-center justify-center text-ink-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <DashboardEmpty
          icon={Handshake}
          title="No broker-friendly listings yet"
          body="When sellers tick 'Open to broker referrals' on their listing, they show up here."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <li key={p.id} className="surface-card overflow-hidden">
              <Link href={`/property/${p.id}`} className="relative block aspect-[4/3] bg-ink-100">
                <Image src={p.coverUrl} alt={p.title} fill sizes="(min-width:1024px) 280px, 50vw" className="object-cover" />
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-violet-500 px-2 py-0.5 text-[10.5px] font-bold text-white shadow-soft">
                  {p.effectiveCommissionPct.toFixed(1)}% comm.
                </span>
              </Link>
              <div className="p-4">
                <p className="truncate text-[14px] font-bold text-ink-900">{p.title}</p>
                <p className="inline-flex items-center gap-1 text-[12px] text-ink-500">
                  <MapPin className="h-3 w-3 text-brand-500" />
                  {p.locality}, {p.city}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[14px] font-bold text-emerald-700">{formatInr(p.priceInr)}</p>
                  <p className="text-[11px] text-ink-500">
                    {p.bhk ? `${p.bhk} BHK · ` : ""}{p.areaSqft} sqft
                  </p>
                </div>
                <p className="mt-1 text-[11.5px] text-ink-500">
                  You earn ≈ <strong className="text-violet-700">
                    {formatInr(Math.round(p.priceInr * p.effectiveCommissionPct / 100))}
                  </strong>
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => setReferFor(p)}
                  iconLeft={<Handshake className="h-3.5 w-3.5" />}
                >
                  Refer a buyer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {referFor && (
        <ReferModal
          property={referFor}
          onClose={() => setReferFor(null)}
          onDone={() => {
            setReferFor(null);
            toast.show({ kind: "success", title: "Referral saved" });
          }}
        />
      )}
    </div>
  );
}

function ReferModal({
  property, onClose, onDone,
}: { property: MarketProperty; onClose: () => void; onDone: () => void }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/broker/refer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          buyerPhone: `+91${phone.replace(/\D/g, "")}`,
          buyerName: name || undefined,
          note: note || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.show({ kind: "error", title: "Couldn't refer", description: data.error });
        return;
      }
      onDone();
    } catch {
      toast.show({ kind: "error", title: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lift"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
            <Handshake className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-bold text-ink-900">Refer a buyer</h2>
            <p className="truncate text-[12.5px] text-ink-500">{property.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full hover:bg-ink-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-4 block">
          <span className="text-[12.5px] font-semibold text-ink-700">Buyer's phone</span>
          <div className="mt-1 flex h-11 rounded-xl border border-ink-200 bg-white focus-within:border-brand-500">
            <span className="grid w-12 place-items-center border-r border-ink-200 text-[13px] font-semibold text-ink-700">+91</span>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit phone"
              className="flex-1 bg-transparent px-3 text-[14px] focus:outline-none"
            />
          </div>
        </label>

        <label className="mt-3 block">
          <span className="text-[12.5px] font-semibold text-ink-700">Buyer's name (optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" />
        </label>

        <label className="mt-3 block">
          <span className="text-[12.5px] font-semibold text-ink-700">Internal note (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Why this property fits this buyer."
            className="input mt-1 min-h-[60px] resize-none"
          />
        </label>

        <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-[12px] text-violet-800">
          You earn <strong>{formatInr(Math.round(property.priceInr * property.effectiveCommissionPct / 100))}</strong> if the buyer's offer is accepted.
        </p>

        <Button type="submit" variant="primary" size="md" className="mt-4 w-full" disabled={submitting || phone.length < 10}>
          {submitting ? "Saving…" : "Save referral"}
        </Button>
      </form>
    </div>
  );
}
