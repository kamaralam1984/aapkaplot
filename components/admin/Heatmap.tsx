"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { buildHeatmap } from "@/lib/mock-dashboard";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Heatmap() {
  const data = useMemo(buildHeatmap, []);

  // emerald ramp
  const tone = (v: number) => {
    if (v < 0.2) return "bg-emerald-50";
    if (v < 0.4) return "bg-emerald-100";
    if (v < 0.6) return "bg-emerald-200";
    if (v < 0.8) return "bg-emerald-400";
    return "bg-emerald-600";
  };

  return (
    <div className="surface-card p-5">
      <h3 className="text-[14px] font-bold text-ink-900">Search intensity heatmap</h3>
      <p className="text-[12.5px] text-ink-500">Hours of day × day of week — when buyers search the most.</p>

      <div className="mt-5 overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header */}
          <div className="grid grid-cols-[40px_repeat(7,minmax(28px,1fr))] gap-1 text-[10.5px] font-semibold text-ink-500">
            <span></span>
            {DAYS.map((d) => (
              <span key={d} className="text-center uppercase tracking-wider">{d}</span>
            ))}
          </div>

          {/* Rows */}
          {data.map((row, h) => (
            <div key={h} className="mt-1 grid grid-cols-[40px_repeat(7,minmax(28px,1fr))] gap-1">
              <span className="text-right text-[10.5px] font-medium tabular-nums text-ink-500">
                {String(h).padStart(2, "0")}:00
              </span>
              {row.map((v, d) => (
                <motion.span
                  key={d}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: (h * 7 + d) * 0.003 }}
                  title={`${DAYS[d]} ${h}:00 — intensity ${(v * 100).toFixed(0)}%`}
                  className={`h-4 rounded-[3px] ${tone(v)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-5 flex items-center justify-end gap-1 text-[10.5px] text-ink-500">
        Low
        <span className="h-3 w-3 rounded-sm bg-emerald-50" />
        <span className="h-3 w-3 rounded-sm bg-emerald-100" />
        <span className="h-3 w-3 rounded-sm bg-emerald-200" />
        <span className="h-3 w-3 rounded-sm bg-emerald-400" />
        <span className="h-3 w-3 rounded-sm bg-emerald-600" />
        High
      </div>
    </div>
  );
}
