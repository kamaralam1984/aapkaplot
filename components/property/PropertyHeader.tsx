"use client";

import { useState } from "react";
import { BadgeCheck, Heart, MapPin, ShieldCheck, Sparkles, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import type { PropertyDetail } from "@/lib/types";
import { formatArea, formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ShareMenu } from "./ShareMenu";
import { useFavorites } from "@/lib/use-favorites";

interface PropertyHeaderProps {
  property: PropertyDetail;
}

export function PropertyHeader({ property }: PropertyHeaderProps) {
  const { has, toggle } = useFavorites();
  const saved = has(property.id);
  const pricePerSqft = property.insights.pricePerSqft;
  const priceDropped =
    property.previousPriceInr && property.previousPriceInr > property.priceInr;

  return (
    <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {property.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-700 border border-emerald-200/70">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified Owner
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11.5px] font-semibold text-sky-700 border border-sky-200/70">
            <ShieldCheck className="h-3.5 w-3.5" />
            Trust Score {property.trustScore}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11.5px] font-semibold text-violet-700 border border-violet-200/70">
            <Sparkles className="h-3.5 w-3.5" />
            AI Investment {property.insights.investmentScore}/100
          </span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-3 text-display-md font-display text-ink-900"
        >
          {property.title}
          {property.bhk && <span className="text-ink-500"> · {property.bhk} BHK</span>}
        </motion.h1>
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-[14px] text-ink-600">
          <MapPin className="h-4 w-4 text-brand-500" />
          {property.location.locality}, {property.location.city}, {property.location.state}
        </p>
      </div>

      {/* Price block */}
      <div className="flex flex-col items-start gap-3 sm:items-end">
        <div className="flex items-baseline gap-2">
          {priceDropped && (
            <span className="text-[13px] font-medium text-ink-400 line-through">
              {formatInr(property.previousPriceInr!)}
            </span>
          )}
          <span className="text-3xl font-bold tracking-tight text-emerald-600 sm:text-4xl">
            {formatInr(property.priceInr)}
          </span>
        </div>
        <p className="text-[13px] text-ink-500">
          {formatArea(property.areaSqft)} · ₹{pricePerSqft.toLocaleString("en-IN")}/sqft
          {priceDropped && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
              <TrendingDown className="h-3 w-3" />
              Price dropped
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toggle(property.id)}
            aria-pressed={saved}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-[13px] font-semibold transition",
              saved
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-ink-200 bg-white text-ink-700 hover:border-rose-200 hover:text-rose-600 shadow-soft"
            )}
          >
            <Heart className={cn("h-4 w-4", saved && "fill-current")} />
            {saved ? "Saved" : "Save"}
          </button>
          <ShareMenu
            title={`${property.title} in ${property.location.locality}`}
            text={`${formatInr(property.priceInr)} · ${property.areaSqft} sqft`}
            url={`/property/${property.id}`}
          />
        </div>
      </div>
    </header>
  );
}
