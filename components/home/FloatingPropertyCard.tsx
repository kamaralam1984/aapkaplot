"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, MapPin } from "lucide-react";
import type { Property } from "@/lib/types";
import { formatInr } from "@/lib/format";
import { formatDistance } from "@/lib/haversine";
import { cn } from "@/lib/utils";

interface FloatingPropertyCardProps {
  property: Property & { distanceKm?: number };
  position: { top?: string; bottom?: string; left?: string; right?: string };
  delay?: number;
  className?: string;
}

export function FloatingPropertyCard({
  property,
  position,
  delay = 0,
  className,
}: FloatingPropertyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      style={position}
      className={cn(
        "absolute z-20 w-[210px] animate-float rounded-2xl border border-white/70 bg-white/95 p-2 shadow-lift backdrop-blur-xl",
        className
      )}
    >
      <Link href={`/property/${property.id}`} className="flex gap-2.5">
        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-100">
          <Image
            src={property.media.cover}
            alt={property.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-ink-500">
            {property.verified && <BadgeCheck className="h-3 w-3 text-emerald-600" />}
            {typeof property.distanceKm === "number" && (
              <span>{formatDistance(property.distanceKm)} away</span>
            )}
          </p>
          <p className="truncate text-[12.5px] font-bold text-ink-900">{property.title}</p>
          <p className="truncate text-[13px] font-bold text-emerald-600">
            {formatInr(property.priceInr)}
          </p>
          <p className="inline-flex items-center gap-0.5 truncate text-[10.5px] text-ink-500">
            <MapPin className="h-2.5 w-2.5 text-brand-500" />
            {property.location.locality}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
