"use client";

import { Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { PropertyDetail } from "@/lib/types";
import { formatInr } from "@/lib/format";

interface MobileStickyCTAProps {
  property: PropertyDetail;
}

export function MobileStickyCTA({ property }: MobileStickyCTAProps) {
  const waNumber = (property.owner.phoneMasked ?? "+91 9800000000").replace(/\D/g, "");
  const waMessage = encodeURIComponent(
    `Hi ${property.owner.name}, I'm interested in your AapKaPlot listing — "${property.title}".`
  );

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/70 bg-white/95 px-3 py-2.5 shadow-lift backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-ink-500">{property.location.locality}</p>
          <p className="truncate text-[16px] font-bold text-emerald-600">{formatInr(property.priceInr)}</p>
        </div>
        <a
          href={`https://wa.me/${waNumber}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-[13px] font-semibold text-emerald-700"
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </a>
        <a
          href={`tel:${waNumber}`}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand-gradient px-4 text-[13px] font-semibold text-white shadow-glow"
        >
          <Phone className="h-4 w-4" />
          Call Owner
        </a>
      </div>
    </motion.div>
  );
}
