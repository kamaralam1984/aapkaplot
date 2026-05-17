"use client";

import { useMemo, useState } from "react";
import { IndianRupee, Calculator, TrendingUp } from "lucide-react";
import { formatInr } from "@/lib/format";

interface EMICalculatorProps {
  defaultPriceInr: number;
}

/**
 * Standard equated monthly installment:
 *   EMI = P · r · (1+r)^n / ((1+r)^n − 1)
 * where r is monthly rate, n is months.
 *
 * Pure JS, no chart library — uses an inline SVG donut to keep bundle size
 * tiny. All inputs run free; no API calls.
 */
function computeEmi(principal: number, annualRatePct: number, years: number) {
  const n = years * 12;
  const r = annualRatePct / 12 / 100;
  if (n <= 0 || principal <= 0) return { monthly: 0, total: 0, interest: 0 };
  if (r === 0) {
    const monthly = principal / n;
    return { monthly, total: monthly * n, interest: 0 };
  }
  const pow = Math.pow(1 + r, n);
  const monthly = (principal * r * pow) / (pow - 1);
  const total = monthly * n;
  return { monthly, total, interest: total - principal };
}

export function EMICalculator({ defaultPriceInr }: EMICalculatorProps) {
  const [price, setPrice] = useState<number>(defaultPriceInr);
  const [downPct, setDownPct] = useState<number>(20);
  const [ratePct, setRatePct] = useState<number>(8.5);
  const [years, setYears] = useState<number>(20);

  const down = Math.round((price * downPct) / 100);
  const principal = Math.max(0, price - down);

  const { monthly, total, interest } = useMemo(
    () => computeEmi(principal, ratePct, years),
    [principal, ratePct, years]
  );

  const principalPct = total > 0 ? (principal / total) * 100 : 0;
  const interestPct = 100 - principalPct;

  return (
    <section className="surface-card overflow-hidden">
      <header className="flex items-center gap-3 border-b border-ink-200/70 bg-white/60 p-4 backdrop-blur">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Calculator className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-ink-900">Home loan EMI calculator</h3>
          <p className="text-[12.5px] text-ink-500">
            Estimate monthly payments based on price, down payment & loan tenure.
          </p>
        </div>
      </header>

      <div className="grid gap-6 p-4 lg:grid-cols-[1fr_220px] lg:p-6">
        <div className="space-y-5">
          <Slider
            label="Property price"
            value={price}
            min={500_000}
            max={Math.max(50_000_000, defaultPriceInr * 2)}
            step={100_000}
            displayValue={formatInr(price)}
            onChange={setPrice}
            iconLeft={<IndianRupee className="h-3.5 w-3.5" />}
          />
          <Slider
            label="Down payment"
            value={downPct}
            min={0}
            max={90}
            step={1}
            displayValue={`${downPct}% · ${formatInr(down)}`}
            onChange={setDownPct}
          />
          <Slider
            label="Interest rate"
            value={ratePct}
            min={5}
            max={15}
            step={0.05}
            displayValue={`${ratePct.toFixed(2)} % p.a.`}
            onChange={setRatePct}
          />
          <Slider
            label="Loan tenure"
            value={years}
            min={1}
            max={30}
            step={1}
            displayValue={`${years} year${years === 1 ? "" : "s"}`}
            onChange={setYears}
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-ink-50/60 p-5">
          <Donut principalPct={principalPct} interestPct={interestPct} />
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">
            Monthly EMI
          </p>
          <p className="text-display-md font-display text-emerald-700">
            {formatInr(Math.round(monthly))}
          </p>
        </div>
      </div>

      <footer className="grid grid-cols-3 gap-2 border-t border-ink-200/70 bg-white/60 p-4 text-center backdrop-blur lg:p-5">
        <Stat label="Loan amount" value={formatInr(principal)} />
        <Stat label="Total interest" value={formatInr(Math.round(interest))} tone="amber" />
        <Stat label="Total payable" value={formatInr(Math.round(total + down))} tone="emerald" />
      </footer>

      <p className="px-4 pb-4 text-[11.5px] leading-relaxed text-ink-400 lg:px-6">
        <TrendingUp className="mb-0.5 mr-1 inline h-3 w-3" />
        Indicative only. Actual rates vary by bank, credit score, and tenure. Compare offers from
        partner banks before applying.
      </p>
    </section>
  );
}

function Slider({
  label, value, min, max, step, displayValue, onChange, iconLeft,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (v: number) => void;
  iconLeft?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-[12.5px] font-semibold text-ink-700">{label}</label>
        <span className="inline-flex items-center gap-1 rounded-lg bg-ink-100 px-2 py-0.5 text-[12px] font-bold text-ink-900">
          {iconLeft}
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-200 accent-emerald-500"
      />
    </div>
  );
}

function Donut({ principalPct, interestPct }: { principalPct: number; interestPct: number }) {
  // Two-color donut: emerald = principal, amber = interest. Pure SVG, no lib.
  const R = 42;
  const C = 2 * Math.PI * R;
  const principalLen = (principalPct / 100) * C;
  const interestLen = (interestPct / 100) * C;
  return (
    <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
      <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={R} fill="none" stroke="#10b981" strokeWidth="10"
        strokeDasharray={`${principalLen} ${C - principalLen}`}
        strokeDashoffset="0"
      />
      <circle
        cx="50" cy="50" r={R} fill="none" stroke="#f59e0b" strokeWidth="10"
        strokeDasharray={`${interestLen} ${C - interestLen}`}
        strokeDashoffset={`${-principalLen}`}
      />
    </svg>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "amber" }) {
  const toneClass =
    tone === "emerald" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-ink-900";
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`mt-0.5 text-[14px] font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
