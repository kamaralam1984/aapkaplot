"use client";

import { useEffect, useState } from "react";

/** Conversion factor → 1 unit = X sqft. */
const SQFT_PER: Record<AreaUnit, number> = {
  sqft:    1,
  sqm:     10.7639,
  sqyd:    9,
  katha:   1361.25,    // Bihar standard (20 katha = 1 bigha)
  bigha:   27225,      // Bihar standard
  acre:    43560,
  hectare: 107639.1,
};

export const AREA_UNITS = [
  { id: "sqft",    label: "sq ft",  helper: "Square feet" },
  { id: "sqm",     label: "sq m",   helper: "Square metres" },
  { id: "sqyd",    label: "sq yd",  helper: "Square yards" },
  { id: "katha",   label: "katha",  helper: "Katha (Bihar / Bengal)" },
  { id: "bigha",   label: "bigha",  helper: "Bigha (Bihar)" },
  { id: "acre",    label: "acre",   helper: "Acres" },
  { id: "hectare", label: "ha",     helper: "Hectares" },
] as const;

export type AreaUnit = (typeof AREA_UNITS)[number]["id"];

interface AreaInputProps {
  /** Canonical area in square feet. */
  valueSqft: number | undefined;
  onChange: (sqft: number | undefined) => void;
  /** Initial unit to display in — defaults to sqft. The user can change it. */
  defaultUnit?: AreaUnit;
  /** Show below the input — typically rendered by the surrounding Field wrapper. */
  placeholder?: string;
}

/**
 * Two-part area entry — number on the left, unit dropdown on the right.
 *
 * Internal state is the visible "display value" (in the currently-selected
 * unit). On every keystroke / unit change we recompute the canonical sqft
 * and call onChange(sqft). The parent never has to know the unit existed.
 *
 * Switching units mid-flow: we re-derive the display value from the stored
 * sqft so the user sees the same physical area expressed in the new unit
 * (e.g. 1500 sqft → 1.10 katha).
 */
export function AreaInput({ valueSqft, onChange, defaultUnit = "sqft", placeholder }: AreaInputProps) {
  const [unit, setUnit] = useState<AreaUnit>(defaultUnit);
  const [display, setDisplay] = useState<string>(
    valueSqft != null && valueSqft > 0
      ? toDisplay(valueSqft, defaultUnit)
      : "",
  );

  // Reflect external changes (e.g. when the form pre-fills the draft on edit).
  useEffect(() => {
    if (valueSqft == null || valueSqft <= 0) {
      setDisplay("");
      return;
    }
    setDisplay(toDisplay(valueSqft, unit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueSqft]);

  function commit(nextDisplay: string, nextUnit: AreaUnit) {
    setDisplay(nextDisplay);
    setUnit(nextUnit);
    const n = Number(nextDisplay);
    if (!Number.isFinite(n) || n <= 0) {
      onChange(undefined);
      return;
    }
    const sqft = Math.round(n * SQFT_PER[nextUnit]);
    onChange(sqft);
  }

  function onUnitChange(next: AreaUnit) {
    // Re-derive display so the physical area stays the same when the user
    // switches units (1500 sqft -> 1.10 katha).
    if (valueSqft != null && valueSqft > 0) {
      const nextDisplay = toDisplay(valueSqft, next);
      setDisplay(nextDisplay);
    }
    setUnit(next);
  }

  return (
    <div>
      <div className="flex h-11 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-soft focus-within:border-brand-500 focus-within:shadow-ring">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={display}
          onChange={(e) => commit(e.target.value, unit)}
          placeholder={placeholder ?? "e.g. 1500"}
          className="min-w-0 flex-1 bg-transparent px-3 text-[14px] tabular-nums outline-none placeholder:text-ink-400"
        />
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value as AreaUnit)}
          className="border-l border-ink-200 bg-ink-50/60 px-2.5 text-[13px] font-semibold text-ink-800 outline-none"
          aria-label="Area unit"
        >
          {AREA_UNITS.map((u) => (
            <option key={u.id} value={u.id} title={u.helper}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
      {valueSqft != null && valueSqft > 0 && (
        <p className="mt-1 text-[11.5px] text-ink-500">
          = {valueSqft.toLocaleString("en-IN")} sq ft
          {unit !== "sqft" && ` (saved in sqft)`}
        </p>
      )}
    </div>
  );
}

function toDisplay(sqft: number, unit: AreaUnit): string {
  const v = sqft / SQFT_PER[unit];
  // Pretty round: integers for sqft, 2 decimals elsewhere unless > 1000.
  if (unit === "sqft" || unit === "sqyd" || unit === "sqm") return Math.round(v).toString();
  if (v >= 100) return v.toFixed(0);
  return v.toFixed(2);
}
