"use client";

import { Building2, ExternalLink, TrendingDown } from "lucide-react";

interface HomeLoanBannerProps {
  priceInr: number;
}

const LENDERS = [
  { name: "HDFC Bank",  rate: "8.50%", url: "https://www.hdfcbank.com/personal/borrow/popular-loans/home-loan", logo: "🏦" },
  { name: "SBI",        rate: "8.40%", url: "https://homeloans.sbi/", logo: "🏛️" },
  { name: "ICICI Bank", rate: "8.75%", url: "https://www.icicibank.com/Personal-Banking/loans/home-loan", logo: "🏢" },
];

function formatEmi(price: number, ratePercent: number, years: number): string {
  const r = ratePercent / 100 / 12;
  const n = years * 12;
  const emi = (price * 0.8 * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return `₹${Math.round(emi / 1000)}K/mo`;
}

export function HomeLoanBanner({ priceInr }: HomeLoanBannerProps) {
  const emi = formatEmi(priceInr, 8.5, 20);

  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-blue-600" />
        <p className="text-[13.5px] font-bold text-blue-900">Home Loan Available</p>
        <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
          <TrendingDown className="h-3.5 w-3.5" />
          From 8.40% p.a.
        </span>
      </div>
      <p className="mt-1 text-[12px] text-blue-700">
        EMI starts at <strong>{emi}</strong> (80% loan, 20 yrs)
      </p>

      <div className="mt-3 space-y-2">
        {LENDERS.map((l) => (
          <a
            key={l.name}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center justify-between rounded-xl border border-blue-100 bg-white px-3 py-2 text-[12.5px] transition hover:border-blue-300 hover:shadow-sm"
          >
            <span className="flex items-center gap-2 font-semibold text-ink-800">
              <span>{l.logo}</span>
              {l.name}
            </span>
            <span className="flex items-center gap-1 font-bold text-emerald-600">
              {l.rate}
              <ExternalLink className="h-3 w-3 text-ink-400" />
            </span>
          </a>
        ))}
      </div>

      <p className="mt-2 text-center text-[10.5px] text-ink-400">
        *Rates indicative. Check with lender for final offer.
      </p>
    </div>
  );
}
