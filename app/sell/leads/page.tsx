"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MessageCircle, Phone, Inbox, Loader2, Check, X, Handshake,
} from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatRelativeTime, formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";

type Status = "new" | "contacted" | "qualified" | "lost";

interface ApiLead {
  id: string;
  via: string;
  status: Status;
  message: string;
  offerAmountInr: number | null;
  offerStatus: string | null;
  createdAt: string;
  property: { id: string; title: string; coverUrl: string; priceInr: number; locality: string; city: string } | null;
  buyer: { id: string; name: string; phone: string; email: string | null };
}

const STATUS_STYLE: Record<Status, string> = {
  new:       "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  contacted: "bg-sky-50 text-sky-700 border-sky-200/70",
  qualified: "bg-violet-50 text-violet-700 border-violet-200/70",
  lost:      "bg-ink-100 text-ink-700 border-ink-200",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<ApiLead[] | null>(null);
  const [mode, setMode] = useState<"live" | "mock" | "db_disabled">("live");
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/seller/leads", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (data.mode === "db_disabled") setMode("db_disabled");
        else setMode("live");
        // Always trust the API — no mock fallback. Mock leads had hard-coded
        // ids like "l1" that pointed at /chat/l1 (a 404) when clicked.
        setLeads(Array.isArray(data.leads) ? data.leads : []);
      } catch {
        setMode("live");
        setLeads([]);
      }
    })();
  }, []);

  const setStatus = async (id: string, status: Status) => {
    setLeads((cur) => cur?.map((l) => (l.id === id ? { ...l, status } : l)) ?? null);
    if (mode !== "live") return;
    await fetch("/api/seller/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {});
  };

  const decideOffer = async (id: string, offerStatus: "accepted" | "declined" | "countered") => {
    setLeads((cur) => cur?.map((l) => (l.id === id ? { ...l, offerStatus } : l)) ?? null);
    if (mode !== "live") {
      toast.show({ kind: "info", title: "Recorded locally", description: "Live offers need DB." });
      return;
    }
    await fetch("/api/seller/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, offerStatus }),
    }).catch(() => {});
    toast.show({
      kind: offerStatus === "accepted" ? "success" : "info",
      title: `Offer ${offerStatus}`,
    });
  };

  if (leads === null) {
    return (
      <div className="flex h-48 items-center justify-center text-ink-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={`${leads.length} total leads`}
        title="Leads inbox"
        subtitle={
          mode === "live"
            ? "Buyers who reached out across your listings. Reply fast — response time strongly affects conversion."
            : "Sample leads shown — your real leads will appear once buyers reach out."
        }
      />

      <div className="surface-card overflow-hidden">
        <ul className="divide-y divide-ink-200/70">
          {leads.map((l) => (
            <li key={l.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-[13px] font-bold text-white">
                {l.buyer.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-bold text-ink-900">{l.buyer.name}</p>
                  <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-500">
                    <MessageCircle className="h-3 w-3" /> {l.via}
                  </span>
                  <span className="text-[11.5px] text-ink-400">· {formatRelativeTime(l.createdAt)}</span>
                </div>
                {l.property && (
                  <p className="mt-0.5 inline-flex items-center gap-2 text-[12px] text-ink-500">
                    <Image
                      src={l.property.coverUrl}
                      alt={l.property.title}
                      width={28}
                      height={20}
                      className="rounded object-cover"
                    />
                    <Link href={`/property/${l.property.id}`} className="font-semibold text-ink-700 hover:underline">
                      {l.property.title}
                    </Link>
                  </p>
                )}
                {l.message && (
                  <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-[13px] text-ink-700">
                    “{l.message}”
                  </p>
                )}
                {l.offerAmountInr != null && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-[12.5px] font-semibold text-amber-800">
                    <Handshake className="h-3.5 w-3.5" />
                    Offered {formatInr(l.offerAmountInr)}
                    {l.property?.priceInr && (
                      <span className="font-normal text-amber-700">
                        ({Math.round((l.offerAmountInr / l.property.priceInr) * 100)}% of asking)
                      </span>
                    )}
                    {l.offerStatus && (
                      <span className="ml-1 rounded-full bg-white px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-amber-800">
                        {l.offerStatus}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-stretch gap-2 lg:items-end">
                <select
                  value={l.status}
                  onChange={(e) => setStatus(l.id, e.target.value as Status)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
                    STATUS_STYLE[l.status]
                  )}
                >
                  <option value="new">new</option>
                  <option value="contacted">contacted</option>
                  <option value="qualified">qualified</option>
                  <option value="lost">lost</option>
                </select>
                <div className="flex gap-1.5">
                  <Link
                    href={`/chat/${l.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-[12px] font-semibold text-ink-700 hover:border-brand-500/40"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Chat
                  </Link>
                  {l.buyer.phone && (
                    <a
                      href={`tel:${l.buyer.phone}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-gradient px-3 text-[12px] font-semibold text-white shadow-glow"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                  )}
                </div>
                {l.offerAmountInr != null && l.offerStatus === "pending" && (
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      iconLeft={<X className="h-3.5 w-3.5" />}
                      onClick={() => decideOffer(l.id, "declined")}
                      className="flex-1 text-rose-700"
                    >
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      iconLeft={<Check className="h-3.5 w-3.5" />}
                      onClick={() => decideOffer(l.id, "accepted")}
                      className="flex-1"
                    >
                      Accept
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
          {leads.length === 0 && (
            <li className="px-5 py-10 text-center text-ink-500">
              <Inbox className="mx-auto mb-2 h-8 w-8 text-ink-300" />
              No leads yet — share your listing on WhatsApp to get the first one.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
