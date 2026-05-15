"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const COHORTS = ["W-7", "W-6", "W-5", "W-4", "W-3", "W-2", "W-1", "This week"];
const WEEKS = 8;

function build(): number[][] {
  // Retention triangle — first cell = 100%, each subsequent week drops 18–35%.
  return COHORTS.map((_, c) => {
    const arr: number[] = [];
    let v = 1;
    for (let w = 0; w < WEEKS - c; w++) {
      arr.push(v);
      v = v * (0.62 + Math.random() * 0.18);
    }
    return arr;
  });
}

function tone(v: number) {
  if (v > 0.7) return "bg-emerald-600 text-white";
  if (v > 0.5) return "bg-emerald-400 text-white";
  if (v > 0.3) return "bg-emerald-200 text-emerald-900";
  if (v > 0.15) return "bg-emerald-100 text-emerald-800";
  return "bg-ink-100 text-ink-500";
}

export function CohortGrid() {
  const data = useMemo(build, []);

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="grid grid-cols-[80px_repeat(8,minmax(56px,1fr))] gap-1 text-[10.5px] font-semibold text-ink-500">
          <span></span>
          {Array.from({ length: WEEKS }).map((_, i) => (
            <span key={i} className="text-center uppercase tracking-wider">W{i}</span>
          ))}
        </div>
        {data.map((row, c) => (
          <div key={c} className="mt-1 grid grid-cols-[80px_repeat(8,minmax(56px,1fr))] gap-1">
            <span className="self-center text-right text-[11px] font-semibold text-ink-700">{COHORTS[c]}</span>
            {row.map((v, w) => (
              <motion.span
                key={w}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: (c * WEEKS + w) * 0.01 }}
                className={`grid h-9 place-items-center rounded-md text-[11px] font-bold ${tone(v)}`}
                title={`Retention ${(v * 100).toFixed(0)}%`}
              >
                {(v * 100).toFixed(0)}%
              </motion.span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
