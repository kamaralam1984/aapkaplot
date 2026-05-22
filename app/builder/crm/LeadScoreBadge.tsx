"use client";

type BuyerType = "serious" | "investor" | "urgent" | "casual" | "spam";

interface LeadScoreBadgeProps {
  score: number;
  buyerType: BuyerType | string;
}

const TYPE_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  serious:  { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500", label: "Serious" },
  investor: { bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-500",   label: "Investor" },
  urgent:   { bg: "bg-orange-100",  text: "text-orange-800",  dot: "bg-orange-500",  label: "Urgent" },
  casual:   { bg: "bg-slate-100",   text: "text-slate-700",   dot: "bg-slate-400",   label: "Casual" },
  spam:     { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-400",     label: "Spam" },
};

export function LeadScoreBadge({ score, buyerType }: LeadScoreBadgeProps) {
  const cfg = TYPE_CONFIG[buyerType] ?? TYPE_CONFIG.casual;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}
      title={`Score: ${score}/100`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label} · {score}
    </span>
  );
}
