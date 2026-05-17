import { Flame, Sparkles, TrendingDown } from "lucide-react";
import type { Property } from "@/lib/types";
import { NearbyRail } from "./NearbyRail";

interface TopPicksStripProps {
  latest: Property[];
  sponsored: Property[];
  bestDeals: Property[];
}

/**
 * Three stacked horizontal rails at the very top of the home page:
 *   1. Latest    — newest listings, gets the "Just added" eyebrow
 *   2. Sponsored — featured / boosted listings (paid placement)
 *   3. Best deals — price-dropped properties (highest urgency)
 *
 * Each rail reuses the existing <NearbyRail> component, which already
 * handles scroll arrows, snap, and PropertyCard rendering.
 */
export function TopPicksStrip({ latest, sponsored, bestDeals }: TopPicksStripProps) {
  return (
    <div className="space-y-10 pt-8 lg:pt-12">
      {bestDeals.length > 0 && (
        <RailWithEyebrow
          eyebrow="Best deals"
          eyebrowIcon={<TrendingDown className="h-3.5 w-3.5" />}
          eyebrowTone="rose"
        >
          <NearbyRail
            properties={bestDeals}
            title="Price just dropped — grab them before they're gone"
            subtitle="Listings whose owners reduced the asking price this week"
          />
        </RailWithEyebrow>
      )}

      {sponsored.length > 0 && (
        <RailWithEyebrow
          eyebrow="Sponsored"
          eyebrowIcon={<Sparkles className="h-3.5 w-3.5" />}
          eyebrowTone="amber"
        >
          <NearbyRail
            properties={sponsored}
            title="Featured properties from verified owners"
            subtitle="Boosted listings · responses within 24 hours"
          />
        </RailWithEyebrow>
      )}

      {latest.length > 0 && (
        <RailWithEyebrow
          eyebrow="Just added"
          eyebrowIcon={<Flame className="h-3.5 w-3.5" />}
          eyebrowTone="emerald"
        >
          <NearbyRail
            properties={latest}
            title="Latest listings on AapKaPlot"
            subtitle="Fresh from the market — be the first to enquire"
          />
        </RailWithEyebrow>
      )}
    </div>
  );
}

const TONE: Record<string, string> = {
  rose:    "bg-rose-50 text-rose-700 border-rose-200/70",
  amber:   "bg-amber-50 text-amber-700 border-amber-200/70",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
};

function RailWithEyebrow({
  eyebrow, eyebrowIcon, eyebrowTone, children,
}: {
  eyebrow: string;
  eyebrowIcon: React.ReactNode;
  eyebrowTone: keyof typeof TONE;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wider ${TONE[eyebrowTone]}`}>
          {eyebrowIcon}
          {eyebrow}
        </span>
      </div>
      {children}
    </div>
  );
}
