import { cn } from "@/lib/utils";

type Tone = "emerald" | "sky" | "amber" | "rose" | "violet" | "ink";

const toneStyles: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  sky:     "bg-sky-50 text-sky-700 border-sky-200/70",
  amber:   "bg-amber-50 text-amber-700 border-amber-200/70",
  rose:    "bg-rose-50 text-rose-700 border-rose-200/70",
  violet:  "bg-violet-50 text-violet-700 border-violet-200/70",
  ink:     "bg-ink-100 text-ink-700 border-ink-200",
};

const solidStyles: Record<Tone, string> = {
  emerald: "bg-emerald-500 text-white",
  sky:     "bg-sky-500 text-white",
  amber:   "bg-amber-500 text-white",
  rose:    "bg-rose-500 text-white",
  violet:  "bg-violet-500 text-white",
  ink:     "bg-ink-900 text-white",
};

interface BadgeProps {
  tone?: Tone;
  variant?: "soft" | "solid";
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Badge({
  tone = "emerald",
  variant = "soft",
  className,
  children,
  icon,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight",
        variant === "soft" ? `border ${toneStyles[tone]}` : solidStyles[tone],
        className
      )}
    >
      {icon && <span className="shrink-0 -ml-0.5">{icon}</span>}
      {children}
    </span>
  );
}
