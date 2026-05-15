"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Sparkles, ShieldCheck } from "lucide-react";
import type { AIInsights } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PropertyAIInsightsProps {
  insights: AIInsights;
}

export function PropertyAIInsights({ insights }: PropertyAIInsightsProps) {
  const { monthlyTrend, pricePerSqft, areaPricePerSqft, priceVsArea, trustScore, investmentScore, highlights } = insights;

  const path = useMemo(() => buildSparkline(monthlyTrend.map((p) => p.pricePerSqft)), [monthlyTrend]);
  const first = monthlyTrend[0]?.pricePerSqft ?? 0;
  const last = monthlyTrend[monthlyTrend.length - 1]?.pricePerSqft ?? 0;
  const delta = first ? ((last - first) / first) * 100 : 0;
  const trendUp = delta >= 0;

  const verdictLabel =
    priceVsArea === "below" ? "Below area average" :
    priceVsArea === "above" ? "Above area average" : "Fairly priced";
  const verdictTone =
    priceVsArea === "below" ? "bg-emerald-50 text-emerald-700 border-emerald-200/70" :
    priceVsArea === "above" ? "bg-rose-50 text-rose-700 border-rose-200/70" :
    "bg-sky-50 text-sky-700 border-sky-200/70";

  return (
    <section className="surface-card relative mt-6 overflow-hidden p-5 lg:p-6" aria-labelledby="insights-title">
      {/* Decorative gradient blob */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-white/80 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-700 backdrop-blur-sm">
          <Sparkles className="h-3 w-3" />
          AI Insights
        </div>
        <h2 id="insights-title" className="mt-2.5 text-[15px] font-bold text-ink-900">
          Pricing &amp; Investment Signals
        </h2>

        {/* Score cards */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ScoreCard
            label="Trust Score"
            value={trustScore}
            icon={<ShieldCheck className="h-4 w-4" />}
            tone="emerald"
          />
          <ScoreCard
            label="Investment Potential"
            value={investmentScore}
            icon={<TrendingUp className="h-4 w-4" />}
            tone="sky"
          />
        </div>

        {/* Price comparison */}
        <div className="mt-5 grid items-end gap-4 rounded-2xl border border-ink-200/70 bg-white p-4 sm:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
              This property
            </p>
            <p className="mt-1 text-2xl font-bold text-ink-900">
              ₹{pricePerSqft.toLocaleString("en-IN")}
              <span className="text-[13px] font-medium text-ink-500"> /sqft</span>
            </p>
            <p className="mt-1 text-[12.5px] text-ink-500">
              Area avg: ₹{areaPricePerSqft.toLocaleString("en-IN")} /sqft
            </p>
            <span className={cn("mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", verdictTone)}>
              {verdictLabel}
            </span>
          </div>

          {/* Sparkline */}
          <div className="rounded-xl bg-ink-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
                12-month trend
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  trendUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                )}
              >
                {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trendUp ? "+" : ""}
                {delta.toFixed(1)}%
              </span>
            </div>
            <svg viewBox="0 0 100 36" className="mt-2 h-16 w-full">
              <defs>
                <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={path.area} fill="url(#spark)" />
              <path d={path.line} fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {highlights.map((h, i) => (
              <motion.li
                key={h}
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="flex items-start gap-2 rounded-xl bg-white/70 px-3 py-2 text-[13px] text-ink-700"
              >
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {h}
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ScoreCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "emerald" | "sky";
}) {
  const toneBg = tone === "emerald" ? "bg-emerald-500" : "bg-sky-500";
  const toneSoft = tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700";

  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", toneSoft)}>
          {icon}
          {label}
        </span>
        <span className="text-[13px] font-bold text-ink-900">{value}/100</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={cn("h-full rounded-full", toneBg)}
        />
      </div>
    </div>
  );
}

function buildSparkline(values: number[]) {
  if (values.length === 0) return { line: "", area: "" };
  const w = 100;
  const h = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return { line, area };
}
