"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Clock, Loader2 } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { DashboardEmpty } from "@/components/dashboard/DashboardEmpty";
import { Button } from "@/components/ui/Button";
import { MOCK_VISITS, getPropertyById } from "@/lib/mock-dashboard";

type Status = "pending" | "confirmed" | "completed" | "cancelled";

interface ApiVisit {
  id: string;
  propertyId: string;
  slot: string;
  status: Status;
  scheduledFor: string;
  createdAt: string;
  property?: {
    title: string;
    locality: string;
    city: string;
    coverUrl: string;
  };
}

const STATUS_STYLE: Record<Status, string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-200/70",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  completed: "bg-sky-50 text-sky-700 border-sky-200/70",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200/70",
};

export default function VisitsPage() {
  const [visits, setVisits] = useState<ApiVisit[] | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/visit-request", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !Array.isArray(data.visits) || data.visits.length === 0) {
          setUsingMock(true);
          setVisits(MOCK_VISITS as unknown as ApiVisit[]);
          return;
        }
        setVisits(data.visits);
      } catch {
        setUsingMock(true);
        setVisits(MOCK_VISITS as unknown as ApiVisit[]);
      }
    })();
  }, []);

  if (visits === null) {
    return (
      <div className="flex h-48 items-center justify-center text-ink-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const upcoming = visits.filter((v) => v.status !== "completed" && v.status !== "cancelled");
  const past = visits.filter((v) => v.status === "completed" || v.status === "cancelled");

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Property visits"
        title="Your scheduled visits"
        subtitle={
          usingMock
            ? "Sample visits shown — once you book a real visit it appears here."
            : "Confirmed slots are visible to the owner — they'll meet you at the property."
        }
      />

      <section>
        <h2 className="mb-3 text-[15px] font-bold text-ink-900">Upcoming</h2>
        {upcoming.length === 0 ? (
          <DashboardEmpty
            icon={CalendarDays}
            title="No upcoming visits"
            body="When you request a visit on a listing, it shows up here."
          />
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {upcoming.map((v) => (
              <VisitCard key={v.id} visit={v} />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-bold text-ink-900">Past visits</h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {past.map((v) => (
              <VisitCard key={v.id} visit={v} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function VisitCard({ visit }: { visit: ApiVisit }) {
  // DB visits ship a joined `property`; mock visits don't, so look up by id.
  const fromDb = visit.property;
  const mock = !fromDb ? getPropertyById(visit.propertyId) : null;

  const cover = fromDb?.coverUrl ?? mock?.media.cover;
  const title = fromDb?.title ?? mock?.title;
  const locality = fromDb?.locality ?? mock?.location.locality;
  const city = fromDb?.city ?? mock?.location.city;

  if (!title) return null;

  return (
    <li className="surface-card overflow-hidden">
      <div className="flex gap-3 p-3">
        <Link
          href={`/property/${visit.propertyId}`}
          className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-ink-100"
        >
          {cover && (
            <Image src={cover} alt={title} fill sizes="128px" className="object-cover" />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[visit.status]}`}>
              {visit.status}
            </span>
          </div>
          <Link href={`/property/${visit.propertyId}`} className="mt-1 block truncate text-[14px] font-semibold text-ink-900 hover:underline">
            {title}
          </Link>
          <p className="inline-flex items-center gap-1 text-[12px] text-ink-500">
            <MapPin className="h-3 w-3 text-brand-500" />
            {locality}, {city}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink-800">
            <Clock className="h-3.5 w-3.5 text-brand-500" />
            {new Date(visit.scheduledFor).toLocaleString("en-IN", {
              weekday: "short", day: "2-digit", month: "short",
              hour: "2-digit", minute: "2-digit",
            })}
            <span className="font-normal text-ink-500">· {visit.slot}</span>
          </p>
        </div>
      </div>
      {visit.status !== "completed" && visit.status !== "cancelled" && (
        <div className="flex gap-2 border-t border-ink-200/70 p-3">
          <Button variant="outline" size="sm" className="flex-1">Reschedule</Button>
          <Button variant="ghost" size="sm" className="flex-1 text-rose-600 hover:bg-rose-50">Cancel</Button>
        </div>
      )}
    </li>
  );
}
