import Link from "next/link";
import Image from "next/image";
import { Plus, Eye, Inbox, Pencil, Rocket, Pause, Trash2 } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { MOCK_SELLER_LISTINGS } from "@/lib/mock-dashboard";
import { formatInr, formatArea } from "@/lib/format";

const STATUS_STYLE = {
  active:          "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  pending_review:  "bg-amber-50 text-amber-700 border-amber-200/70",
  paused:          "bg-ink-100 text-ink-700 border-ink-200",
  draft:           "bg-ink-100 text-ink-700 border-ink-200",
  sold:            "bg-sky-50 text-sky-700 border-sky-200/70",
  rejected:        "bg-rose-50 text-rose-700 border-rose-200/70",
} as const;

export default function ListingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={`${MOCK_SELLER_LISTINGS.length} listings`}
        title="Your listings"
        subtitle="Edit, pause, boost or remove your properties anytime."
        actions={
          <Link href="/sell/new">
            <Button variant="primary" size="md" iconLeft={<Plus className="h-4 w-4" />}>
              New listing
            </Button>
          </Link>
        }
      />

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-ink-50/50 text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-5 py-3">Property</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Views</th>
                <th className="px-3 py-3">Leads</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/70">
              {MOCK_SELLER_LISTINGS.map((p) => (
                <tr key={p.id} className="text-[13.5px] hover:bg-ink-50/50">
                  <td className="px-5 py-3">
                    <Link href={`/property/${p.id}`} className="flex items-center gap-3">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                        <Image src={p.media.cover} alt={p.title} fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink-900">{p.title}</p>
                        <p className="truncate text-[12px] text-ink-500">
                          {p.location.locality} · {formatArea(p.areaSqft)}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-semibold text-emerald-600">{formatInr(p.priceInr)}</td>
                  <td className="px-3 py-3"><span className="inline-flex items-center gap-1 text-ink-700"><Eye className="h-3.5 w-3.5 text-ink-400" />{p.views.toLocaleString("en-IN")}</span></td>
                  <td className="px-3 py-3"><span className="inline-flex items-center gap-1 text-ink-700"><Inbox className="h-3.5 w-3.5 text-ink-400" />{p.leadsCount}</span></td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[p.status]}`}>
                      {p.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <IconBtn label="Edit"><Pencil className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn label="Boost"><Rocket className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn label="Pause"><Pause className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn label="Delete" tone="rose"><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children, label, tone = "ink",
}: {
  children: React.ReactNode;
  label: string;
  tone?: "ink" | "rose";
}) {
  const cls =
    tone === "rose"
      ? "text-rose-600 hover:bg-rose-50"
      : "text-ink-700 hover:bg-ink-100";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-lg transition ${cls}`}
    >
      {children}
    </button>
  );
}
