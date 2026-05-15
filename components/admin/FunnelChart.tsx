"use client";

import { motion } from "framer-motion";

interface FunnelStep {
  label: string;
  value: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
}

export function FunnelChart({ steps }: FunnelChartProps) {
  const top = steps[0]?.value ?? 1;
  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const prev = i === 0 ? top : steps[i - 1].value;
        const widthPct = (s.value / top) * 100;
        const dropoff = i === 0 ? 0 : ((prev - s.value) / Math.max(1, prev)) * 100;
        return (
          <div key={s.label} className="rounded-xl border border-ink-200/70 bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] font-bold text-ink-900">
                {i + 1}. {s.label}
              </p>
              <div className="flex items-center gap-2 text-[11.5px]">
                <span className="font-semibold text-ink-900">{s.value.toLocaleString("en-IN")}</span>
                {i > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 font-bold ${
                    dropoff > 60
                      ? "bg-rose-50 text-rose-700"
                      : dropoff > 30
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}>
                    -{dropoff.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${widthPct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                className="h-full rounded-full bg-brand-gradient"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
