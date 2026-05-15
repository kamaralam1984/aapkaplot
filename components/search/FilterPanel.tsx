"use client";

import { useState } from "react";
import type { ParsedSearchFilters } from "@/lib/search-params";
import type { AmenityId, ListingIntent, PropertyKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFilterPatch } from "./useFilterPatch";
import { FilterSection } from "./FilterSection";
import { AMENITIES_CATALOG } from "@/lib/property-detail";
import { formatInr } from "@/lib/format";

const INTENTS: { id: ListingIntent; label: string }[] = [
  { id: "buy",  label: "Buy" },
  { id: "rent", label: "Rent" },
  { id: "sell", label: "Sell" },
];

const KINDS: { id: PropertyKind; label: string }[] = [
  { id: "plot",        label: "Plot" },
  { id: "flat",        label: "Flat" },
  { id: "house",       label: "House" },
  { id: "villa",       label: "Villa" },
  { id: "shop",        label: "Shop" },
  { id: "office",      label: "Office" },
  { id: "warehouse",   label: "Warehouse" },
  { id: "agriculture", label: "Agriculture" },
];

const BHKS = [1, 2, 3, 4, 5];
const RADIUS_OPTIONS = [0.5, 2, 5, 10, 25, 100];

interface FilterPanelProps {
  filters: ParsedSearchFilters;
}

export function FilterPanel({ filters }: FilterPanelProps) {
  const patch = useFilterPatch();

  return (
    <div className="surface-card overflow-hidden">
      <header className="border-b border-ink-200/70 px-4 py-3">
        <h2 className="text-[13.5px] font-bold text-ink-900">Filters</h2>
        <p className="text-[11.5px] text-ink-500">
          Refine your search by category, budget &amp; location
        </p>
      </header>

      <FilterSection title="Looking to" defaultOpen>
        <div className="grid grid-cols-3 gap-2">
          {INTENTS.map((i) => {
            const active = filters.intent === i.id;
            return (
              <button
                key={i.id}
                type="button"
                onClick={() => patch({ intent: active ? null : i.id })}
                className={cn(
                  "h-9 rounded-lg border text-[12.5px] font-semibold transition",
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
                )}
              >
                {i.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Property type" count={filters.kind ? 1 : undefined}>
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map((k) => {
            const active = filters.kind === k.id;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => patch({ kind: active ? null : k.id })}
                className={cn(
                  "h-9 rounded-lg border text-[12.5px] font-semibold transition",
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
                )}
              >
                {k.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="BHK" count={filters.bhk ? 1 : undefined}>
        <div className="flex flex-wrap gap-2">
          {BHKS.map((b) => {
            const active = filters.bhk === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => patch({ bhk: active ? null : b })}
                className={cn(
                  "h-9 min-w-[44px] rounded-lg border px-2.5 text-[12.5px] font-semibold transition",
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
                )}
              >
                {b}
                {b === 5 ? "+" : ""}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Budget" count={filters.budgetMin || filters.budgetMax ? 1 : undefined}>
        <BudgetRange
          min={filters.budgetMin}
          max={filters.budgetMax}
          onChange={(min, max) =>
            patch({
              budgetMin: min ?? null,
              budgetMax: max ?? null,
            })
          }
        />
      </FilterSection>

      <FilterSection title="Carpet area (sqft)" count={filters.areaMin || filters.areaMax ? 1 : undefined}>
        <div className="grid grid-cols-2 gap-2">
          <NumberCell
            label="Min"
            value={filters.areaMin ?? ""}
            placeholder="0"
            onCommit={(v) => patch({ areaMin: parseValue(v) })}
          />
          <NumberCell
            label="Max"
            value={filters.areaMax ?? ""}
            placeholder="Any"
            onCommit={(v) => patch({ areaMax: parseValue(v) })}
          />
        </div>
      </FilterSection>

      <FilterSection title="Furnishing" count={filters.furnishing ? 1 : undefined}>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "unfurnished", label: "Unfurnished" },
              { id: "semi",        label: "Semi" },
              { id: "full",        label: "Furnished" },
            ] as const
          ).map((f) => {
            const active = filters.furnishing === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => patch({ furnishing: active ? null : f.id })}
                className={cn(
                  "h-9 rounded-lg border text-[12.5px] font-semibold transition",
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Parking" count={filters.parking ? 1 : undefined}>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-[13px] font-medium text-ink-800">
          <input
            type="checkbox"
            checked={!!filters.parking}
            onChange={(e) => patch({ parking: e.target.checked ? "1" : null })}
            className="h-4 w-4 accent-emerald-500"
          />
          Reserved parking only
        </label>
      </FilterSection>

      <FilterSection title="Nearby" count={filters.nearby.length || undefined}>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: "school",   label: "School" },
              { id: "metro",    label: "Metro" },
              { id: "hospital", label: "Hospital" },
              { id: "market",   label: "Market" },
            ] as const
          ).map((n) => {
            const on = filters.nearby.includes(n.id);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() =>
                  patch({
                    nearby: on
                      ? filters.nearby.filter((x) => x !== n.id)
                      : [...filters.nearby, n.id],
                  })
                }
                className={cn(
                  "h-9 rounded-lg border text-[12.5px] font-semibold transition",
                  on
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
                )}
              >
                {n.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Distance" count={filters.radiusKm ? 1 : undefined}>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((r) => {
            const active = filters.radiusKm === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => patch({ radiusKm: active ? null : r })}
                className={cn(
                  "h-9 rounded-lg border px-3 text-[12.5px] font-semibold transition",
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
                )}
              >
                {r < 1 ? `${Math.round(r * 1000)} m` : `${r} km`}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Amenities" count={filters.amenities.length || undefined}>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.values(AMENITIES_CATALOG).map((a) => {
            const checked = filters.amenities.includes(a.id);
            return (
              <label
                key={a.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition",
                  checked
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...filters.amenities, a.id]
                      : filters.amenities.filter((x) => x !== a.id);
                    patch({ amenities: next });
                  }}
                  className="h-3.5 w-3.5 accent-emerald-500"
                />
                <span className="truncate">{a.label}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Trust">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-[13px] font-medium text-ink-800">
          <input
            type="checkbox"
            checked={!!filters.verifiedOnly}
            onChange={(e) => patch({ verifiedOnly: e.target.checked ? "1" : null })}
            className="h-4 w-4 accent-emerald-500"
          />
          Verified owners only
        </label>
      </FilterSection>
    </div>
  );
}

function BudgetRange({
  min,
  max,
  onChange,
}: {
  min?: number;
  max?: number;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const [draftMin, setDraftMin] = useState(min ?? "");
  const [draftMax, setDraftMax] = useState(max ?? "");

  const presets: { label: string; min?: number; max?: number }[] = [
    { label: "Under ₹25 L", max: 25_00_000 },
    { label: "₹25 L – ₹50 L", min: 25_00_000, max: 50_00_000 },
    { label: "₹50 L – ₹1 Cr", min: 50_00_000, max: 1_00_00_000 },
    { label: "Above ₹1 Cr", min: 1_00_00_000 },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Min"
          value={draftMin}
          placeholder="₹0"
          onChange={(v) => setDraftMin(v)}
          onCommit={(v) => onChange(parseValue(v), parseValue(draftMax))}
        />
        <NumberInput
          label="Max"
          value={draftMax}
          placeholder="₹ Any"
          onChange={(v) => setDraftMax(v)}
          onCommit={(v) => onChange(parseValue(draftMin), parseValue(v))}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const active = (p.min ?? null) === (min ?? null) && (p.max ?? null) === (max ?? null);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setDraftMin(p.min ?? "");
                setDraftMax(p.max ?? "");
                onChange(p.min ?? null, p.max ?? null);
              }}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition",
                active
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {(min != null || max != null) && (
        <p className="text-[11.5px] text-ink-500">
          {min != null ? formatInr(min) : "Any"} – {max != null ? formatInr(max) : "Any"}
        </p>
      )}
    </div>
  );
}

function NumberInput({
  label,
  value,
  placeholder,
  onChange,
  onCommit,
}: {
  label: string;
  value: number | string;
  placeholder: string;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onCommit(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        placeholder={placeholder}
        className="mt-1 h-9 w-full rounded-lg border border-ink-200 bg-white px-2.5 text-[13px] placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
      />
    </label>
  );
}

function parseValue(v: number | string): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function NumberCell({
  label, value, placeholder, onCommit,
}: {
  label: string;
  value: number | string;
  placeholder: string;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(String(value ?? ""));
  return (
    <label className="block">
      <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        placeholder={placeholder}
        className="mt-1 h-9 w-full rounded-lg border border-ink-200 bg-white px-2.5 text-[13px] placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
      />
    </label>
  );
}
