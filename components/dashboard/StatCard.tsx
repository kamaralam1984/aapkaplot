import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; direction: "up" | "down" };
  icon: LucideIcon;
  tone?: "emerald" | "sky" | "amber" | "rose" | "violet";
  helper?: string;
}

const TONE_MAP = {
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
} as const;

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "emerald",
  helper,
}: StatCardProps) {
  return (
    <div className="surface-card relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">
          {label}
        </p>
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl", TONE_MAP[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-2.5 text-2xl font-bold tracking-tight text-ink-900">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-[12px]">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
              delta.direction === "up"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            )}
          >
            {delta.direction === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {delta.value}
          </span>
        )}
        {helper && <span className="text-ink-500">{helper}</span>}
      </div>
    </div>
  );
}
