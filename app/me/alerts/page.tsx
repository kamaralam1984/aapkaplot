import Link from "next/link";
import { BellRing, Plus, ArrowRight, Zap, Sun, CalendarDays } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { MOCK_SEARCH_ALERTS } from "@/lib/mock-dashboard";

const FREQ_ICON = {
  instant: <Zap className="h-3.5 w-3.5" />,
  daily: <Sun className="h-3.5 w-3.5" />,
  weekly: <CalendarDays className="h-3.5 w-3.5" />,
};

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Saved searches"
        title="Property alerts"
        subtitle="We'll notify you instantly when new properties match these searches."
        actions={
          <Link href="/search">
            <Button variant="primary" size="md" iconLeft={<Plus className="h-4 w-4" />}>
              New alert
            </Button>
          </Link>
        }
      />

      <ul className="grid gap-3 lg:grid-cols-2">
        {MOCK_SEARCH_ALERTS.map((a) => (
          <li key={a.id} className="surface-card flex items-start gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <BellRing className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-[14px] font-bold text-ink-900">{a.label}</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-700">
                  {FREQ_ICON[a.frequency]} {a.frequency}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12.5px] text-ink-500">{a.filtersDescription}</p>
              <div className="mt-3 flex items-center gap-2">
                <Link href={a.url} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand-700 hover:bg-brand-100">
                  {a.newCount} new matches <ArrowRight className="h-3 w-3" />
                </Link>
                <button className="rounded-full px-2.5 py-1 text-[12px] font-semibold text-ink-500 hover:bg-ink-100">
                  Edit
                </button>
                <button className="rounded-full px-2.5 py-1 text-[12px] font-semibold text-rose-600 hover:bg-rose-50">
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
