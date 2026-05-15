import Link from "next/link";
import { MessageCircle, Phone, Inbox } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { MOCK_LEADS, getPropertyById } from "@/lib/mock-dashboard";
import { formatRelativeTime } from "@/lib/format";

const STATUS_STYLE = {
  new:       "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  contacted: "bg-sky-50 text-sky-700 border-sky-200/70",
  qualified: "bg-violet-50 text-violet-700 border-violet-200/70",
  lost:      "bg-ink-100 text-ink-700 border-ink-200",
} as const;

const CHANNEL_ICON = {
  whatsapp: <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />,
  chat: <MessageCircle className="h-3.5 w-3.5 text-sky-600" />,
  call: <Phone className="h-3.5 w-3.5 text-violet-600" />,
};

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={`${MOCK_LEADS.length} total leads`}
        title="Leads inbox"
        subtitle="Buyers who reached out across your listings. Reply fast — response time strongly affects conversion."
      />

      <div className="surface-card overflow-hidden">
        <ul className="divide-y divide-ink-200/70">
          {MOCK_LEADS.map((l) => {
            const p = getPropertyById(l.propertyId);
            return (
              <li key={l.id} className="flex items-start gap-3 px-5 py-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-[13px] font-bold text-white">
                  {l.buyerName.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-bold text-ink-900">{l.buyerName}</p>
                    <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-500">
                      {CHANNEL_ICON[l.channel]} {l.channel}
                    </span>
                    <span className="text-[11.5px] text-ink-400">· {formatRelativeTime(l.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-ink-500">
                    {l.buyerPhoneMasked} · on{" "}
                    <Link href={`/property/${l.propertyId}`} className="font-semibold text-ink-700 hover:underline">
                      {p?.title}
                    </Link>
                  </p>
                  <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-[13px] text-ink-700">
                    "{l.message}"
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[l.status]}`}>
                    {l.status}
                  </span>
                  <div className="flex gap-1.5">
                    <button className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-[12px] font-semibold text-ink-700 hover:border-brand-500/40">
                      <MessageCircle className="h-3.5 w-3.5" /> Reply
                    </button>
                    <button className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-gradient px-3 text-[12px] font-semibold text-white shadow-glow">
                      <Phone className="h-3.5 w-3.5" /> Call
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
          {MOCK_LEADS.length === 0 && (
            <li className="px-5 py-10 text-center text-ink-500">
              <Inbox className="mx-auto mb-2 h-8 w-8 text-ink-300" />
              No leads yet
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
