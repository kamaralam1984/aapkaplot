"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, BadgeCheck, Sparkles, ShieldCheck, Eye, GitCompare } from "lucide-react";
import type { Property, AIBadge } from "@/lib/types";
import { formatInr, formatArea } from "@/lib/format";
import { formatDistance } from "@/lib/haversine";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useFavorites } from "@/lib/use-favorites";
import { useCompare } from "@/lib/use-compare";
import { topViralSignal } from "@/lib/viral-signals";
import { useToast } from "@/components/ui/Toast";
import { track } from "@/lib/track";
import { QuickPreview } from "./QuickPreview";

const badgeToneMap: Record<AIBadge, "emerald" | "sky" | "amber" | "rose" | "violet"> = {
  "near-you": "emerald",
  "best-investment": "sky",
  "high-demand": "amber",
  "price-dropped": "rose",
  "near-metro": "violet",
  trending: "amber",
};

const badgeLabelMap: Record<AIBadge, string> = {
  "near-you": "Near You",
  "best-investment": "Best Investment",
  "high-demand": "High Demand",
  "price-dropped": "Price Dropped",
  "near-metro": "Near Metro",
  trending: "Trending",
};

const VIRAL_TONE = {
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
};

interface PropertyCardProps {
  property: Property & { distanceKm?: number };
  variant?: "default" | "compact";
  showAIBadge?: boolean;
  className?: string;
}

export function PropertyCard({
  property,
  variant = "default",
  showAIBadge = false,
  className,
}: PropertyCardProps) {
  const aiBadge = property.badges?.[0];
  const subtitle = `${formatArea(property.areaSqft)}${
    property.bhk ? ` • ${property.bhk} BHK` : property.kind === "plot" ? " • Plot" : property.kind === "shop" ? " • Shop" : ""
  }`;
  const { has, toggle } = useFavorites();
  const saved = has(property.id);
  const compare = useCompare();
  const inCompare = compare.has(property.id);
  const viral = topViralSignal(property);
  const toast = useToast();

  // Gallery slideshow on hover (cycles through media.gallery if present)
  const gallery: string[] = [
    property.media.cover,
    ...(property.media.gallery ?? []),
  ].slice(0, 5);
  const [imgIdx, setImgIdx] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [preview, setPreview] = useState(false);

  return (
    <>
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); setImgIdx(0); }}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-soft",
          "transition-shadow duration-300 hover:shadow-lift",
          variant === "compact" ? "min-w-[230px] max-w-[260px]" : "",
          className
        )}
      >
        <Link
          href={`/property/${property.id}`}
          aria-label={`${property.title} in ${property.location.locality}`}
          className="absolute inset-0 z-[2]"
        />

        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-100">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={imgIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0"
            >
              <Image
                src={gallery[imgIdx]}
                alt={property.title}
                fill
                sizes="(max-width: 768px) 80vw, 280px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
            </motion.div>
          </AnimatePresence>

          {/* Auto-cycle dots when hovering + multi-image */}
          {gallery.length > 1 && (
            <div className="absolute bottom-2 left-1/2 z-[3] flex -translate-x-1/2 gap-1">
              {gallery.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setImgIdx(i)}
                  onClick={(e) => { e.preventDefault(); setImgIdx(i); }}
                  aria-label={`Image ${i + 1}`}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all",
                    i === imgIdx ? "w-4 bg-white" : "bg-white/60 hover:bg-white"
                  )}
                />
              ))}
            </div>
          )}

          {/* Distance pill */}
          {typeof property.distanceKm === "number" && (
            <div className="absolute left-3 top-3 rounded-xl bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-ink-900 shadow-soft backdrop-blur-sm">
              {formatDistance(property.distanceKm)}
            </div>
          )}

          {/* AI badge (search/ai pages) */}
          {showAIBadge && aiBadge && (
            <div className="absolute left-3 top-3">
              <Badge tone={badgeToneMap[aiBadge]} variant="solid" className="text-[11px]">
                {aiBadge === "best-investment" && <Sparkles className="h-3 w-3" />}
                {badgeLabelMap[aiBadge]}
              </Badge>
            </div>
          )}

          {/* Viral signal (top-right area, under favorite) */}
          {viral && !showAIBadge && (
            <span
              className={cn(
                "absolute left-3 top-12 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold text-white shadow-soft",
                VIRAL_TONE[viral.tone]
              )}
            >
              {viral.id === "trending" && <Sparkles className="h-3 w-3" />}
              {viral.label}
            </span>
          )}

          {/* Favorite */}
          <button
            type="button"
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save to favorites"}
            onClick={(e) => {
              e.preventDefault();
              const willSave = !saved;
              toggle(property.id);
              track(willSave ? "property_saved" : "property_unsaved", {
                propertyId: property.id,
                city: property.location.city,
              });
              toast.show({
                kind: willSave ? "success" : "info",
                title: willSave ? "Saved to favorites" : "Removed from saved",
                description: property.title,
              });
            }}
            className={cn(
              "absolute right-3 top-3 z-[3] grid h-8 w-8 place-items-center rounded-full backdrop-blur-sm transition",
              saved
                ? "bg-rose-500 text-white shadow-glow"
                : "bg-white/90 text-ink-700 shadow-soft hover:bg-white hover:text-rose-500"
            )}
          >
            <Heart className={cn("h-4 w-4", saved && "fill-current")} />
          </button>

          {/* Compare */}
          <button
            type="button"
            aria-pressed={inCompare}
            aria-label={inCompare ? "Remove from compare" : "Add to compare"}
            onClick={(e) => {
              e.preventDefault();
              const result = compare.toggle(property.id);
              if (!result.ok && result.reason === "full") {
                toast.show({
                  kind: "info",
                  title: "Compare list is full",
                  description: `You can compare up to ${compare.max} properties at once.`,
                });
                return;
              }
              toast.show({
                kind: result.action === "added" ? "success" : "info",
                title: result.action === "added" ? "Added to compare" : "Removed from compare",
                description: property.title,
              });
            }}
            className={cn(
              "absolute right-12 top-3 z-[3] grid h-8 w-8 place-items-center rounded-full backdrop-blur-sm transition",
              inCompare
                ? "bg-brand-gradient text-white shadow-glow"
                : "bg-white/90 text-ink-700 shadow-soft hover:bg-white hover:text-brand-600"
            )}
          >
            <GitCompare className="h-4 w-4" />
          </button>

          {/* Quick preview button on hover */}
          {variant !== "compact" && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setPreview(true); }}
              aria-label="Quick preview"
              className={cn(
                "absolute right-3 top-12 z-[3] inline-flex h-8 items-center gap-1 rounded-full bg-white/90 px-2.5 text-[11.5px] font-semibold text-ink-800 shadow-soft backdrop-blur-sm transition",
                hovering ? "opacity-100" : "opacity-0"
              )}
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </button>
          )}

          {/* Trust score */}
          {property.trustScore >= 80 && (
            <div className="absolute bottom-3 right-3 z-[3] inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10.5px] font-bold text-sky-700 shadow-soft backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3" />
              {property.trustScore}
            </div>
          )}

          {/* Verified */}
          {property.verified && variant !== "compact" && (
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-1 text-[11px] font-semibold text-white shadow-soft">
              <BadgeCheck className="h-3 w-3" /> Verified
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3">
          <h3 className="truncate text-[15px] font-semibold tracking-tight text-ink-900">
            {property.title}
          </h3>
          <p className="text-[15px] font-bold text-emerald-600">
            {property.previousPriceInr && (
              <span className="mr-1.5 text-[12px] font-medium text-ink-400 line-through">
                {formatInr(property.previousPriceInr)}
              </span>
            )}
            {formatInr(property.priceInr)}
          </p>
          <p className="text-[12px] text-ink-500">{subtitle}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-500">
            <MapPin className="h-3 w-3 shrink-0 text-brand-500" />
            <span className="truncate">
              {property.location.locality}, {property.location.city}
            </span>
            {typeof property.distanceKm === "number" && variant !== "compact" && (
              <span className="ml-auto inline-flex items-center text-[12px] font-medium text-ink-600">
                <span className="mx-1 text-ink-300">↕</span>
                {formatDistance(property.distanceKm)} away
              </span>
            )}
          </p>
        </div>
      </motion.article>

      <QuickPreview property={preview ? property : null} onClose={() => setPreview(false)} />
    </>
  );
}
