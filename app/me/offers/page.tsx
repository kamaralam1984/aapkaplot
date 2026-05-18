import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Handshake, Inbox, Clock, CheckCircle2, XCircle, Repeat } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { DashboardEmpty } from "@/components/dashboard/DashboardEmpty";
import { Button } from "@/components/ui/Button";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { formatInr, formatRelativeTime } from "@/lib/format";
import { WithdrawOfferButton } from "./WithdrawOfferButton";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700 border-amber-200/70",
  accepted:   "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  declined:   "bg-rose-50 text-rose-700 border-rose-200/70",
  countered:  "bg-sky-50 text-sky-700 border-sky-200/70",
  withdrawn:  "bg-ink-100 text-ink-700 border-ink-200",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:   <Clock className="h-3 w-3" />,
  accepted:  <CheckCircle2 className="h-3 w-3" />,
  declined:  <XCircle className="h-3 w-3" />,
  countered: <Repeat className="h-3 w-3" />,
  withdrawn: <XCircle className="h-3 w-3" />,
};

export default async function OffersPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/me/offers");

  if (process.env.USE_DB !== "1") {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Your offers" title="Offers inbox" subtitle="DB is off." />
      </div>
    );
  }

  const rows = await prisma.lead.findMany({
    where: { fromUserId: session.uid, offerAmountInr: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      offerAmountInr: true,
      offerStatus: true,
      message: true,
      updatedAt: true,
      property: {
        select: { id: true, title: true, coverUrl: true, locality: true, city: true, priceInr: true },
      },
      toUser: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Your offers"
        title={`Offers inbox · ${rows.length}`}
        subtitle="Every offer you've sent, plus the seller's response. We notify you when the status changes."
      />

      {rows.length === 0 ? (
        <DashboardEmpty
          icon={Handshake}
          title="No offers yet"
          body="Browse listings and click 'Make an offer' on any property you're interested in — your offers show up here."
          action={
            <Link href="/search">
              <Button variant="primary" size="md" iconLeft={<Inbox className="h-4 w-4" />}>
                Browse properties
              </Button>
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rows.map((r) => {
            const status = r.offerStatus ?? "pending";
            const asking = r.property?.priceInr ?? 0;
            const pct = asking ? Math.round(((r.offerAmountInr ?? 0) / asking) * 100) : null;
            return (
              <li key={r.id} className="surface-card overflow-hidden">
                <div className="flex gap-3 p-3">
                  {r.property?.coverUrl ? (
                    <Link href={`/property/${r.property.id}`} className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                      <Image src={r.property.coverUrl} alt={r.property.title} fill sizes="128px" className="object-cover" />
                    </Link>
                  ) : (
                    <div className="h-24 w-32 shrink-0 rounded-xl bg-ink-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${STATUS_TONE[status] ?? STATUS_TONE.pending}`}>
                      {STATUS_ICON[status]}
                      {status}
                    </span>
                    <Link href={`/property/${r.property?.id}`} className="mt-1 block truncate text-[14px] font-bold text-ink-900 hover:underline">
                      {r.property?.title ?? "Property"}
                    </Link>
                    <p className="truncate text-[12px] text-ink-500">
                      {r.property?.locality}, {r.property?.city} · Seller: {r.toUser?.name ?? "—"}
                    </p>
                    <p className="mt-2 text-[13px] font-bold text-ink-900">
                      Your offer: {formatInr(r.offerAmountInr ?? 0)}
                      {pct != null && (
                        <span className="ml-1 font-normal text-ink-500">({pct}% of asking)</span>
                      )}
                    </p>
                    {r.message && (
                      <p className="mt-1 line-clamp-2 text-[12px] text-ink-600">"{r.message}"</p>
                    )}
                    <p className="mt-1 text-[11px] text-ink-500">
                      Updated {formatRelativeTime(r.updatedAt.toISOString())}
                    </p>
                  </div>
                </div>
                {status === "pending" && (
                  <div className="flex gap-2 border-t border-ink-200/70 p-3">
                    <WithdrawOfferButton leadId={r.id} />
                    <Link
                      href={`/chat/${r.id}`}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-[12px] font-semibold text-ink-700 hover:border-brand-500/40"
                    >
                      Open chat
                    </Link>
                  </div>
                )}
                {status === "countered" && (
                  <div className="border-t border-ink-200/70 bg-sky-50/40 px-3 py-2 text-[12px] text-sky-800">
                    Seller proposed a new amount. Open chat or re-submit a fresh offer.
                  </div>
                )}
                {status === "accepted" && (
                  <div className="border-t border-ink-200/70 bg-emerald-50/40 px-3 py-2 text-[12px] text-emerald-800">
                    Seller accepted your offer. Open chat to finalise paperwork.
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
