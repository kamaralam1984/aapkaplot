"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BadgeCheck, MessageCircle, Phone, Star, Eye, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { PropertyOwner } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { track } from "@/lib/track";

interface PropertyOwnerCardProps {
  owner: PropertyOwner;
  propertyTitle: string;
  propertyId?: string;
}

export function PropertyOwnerCard({ owner, propertyTitle, propertyId }: PropertyOwnerCardProps) {
  const [phoneRevealed, setPhoneRevealed] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const revealPhone = async () => {
    setRevealing(true);
    try {
      const res = await fetch("/api/lead/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: propertyId ?? "unknown" }),
      });
      if (res.status === 401) {
        toast.show({ kind: "info", title: "Please sign in", description: "Phone reveals require login." });
        router.push(`/auth/login?next=/property/${propertyId ?? ""}`);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "quota_exceeded") {
          toast.show({ kind: "warning", title: "Daily reveal limit reached", description: "Try again in 24 hours." });
        } else {
          toast.show({ kind: "error", title: "Couldn't reveal", description: "Please try again." });
        }
        return;
      }
      setPhoneRevealed(data.phoneMasked);
      track("phone_revealed", { propertyId, remaining: data.remaining });
    } finally {
      setRevealing(false);
    }
  };

  const roleLabel =
    owner.role === "owner" ? "Property Owner" :
    owner.role === "agent" ? "Verified Agent" :
    "Builder / Developer";

  const waMessage = encodeURIComponent(
    `Hi ${owner.name}, I'm interested in your AapKaPlot listing — "${propertyTitle}". Is it still available?`
  );
  const waNumber = (owner.phoneMasked ?? "+91 9800000000").replace(/\D/g, "");

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="surface-card p-5"
    >
      <div className="flex items-start gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-ink-100">
          {owner.avatarUrl ? (
            <Image src={owner.avatarUrl} alt={owner.name} fill sizes="56px" className="object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-brand-gradient text-white font-bold">
              {owner.name.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[14.5px] font-bold leading-tight text-ink-900">
            <span className="truncate">{owner.name}</span>
            {owner.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Verified" />
            )}
          </p>
          <p className="mt-0.5 text-[12.5px] text-ink-500">{roleLabel}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-ink-500">
            {owner.rating != null && (
              <span className="inline-flex items-center gap-0.5 font-semibold text-ink-700">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {owner.rating.toFixed(1)}
              </span>
            )}
            {owner.listingsCount != null && <span>· {owner.listingsCount} listings</span>}
            {owner.responseRateHours != null && <span>· Replies in ~{owner.responseRateHours}h</span>}
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-5 space-y-2">
        <Button
          variant="primary"
          size="lg"
          iconLeft={revealing ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Phone className="h-[18px] w-[18px]" />}
          onClick={revealPhone}
          disabled={revealing || !!phoneRevealed}
          className="w-full"
        >
          {phoneRevealed ? phoneRevealed : revealing ? "Revealing…" : "Show Phone Number"}
        </Button>
        <a
          href={`https://wa.me/${waNumber}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-[14px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          <WhatsAppIcon className="h-5 w-5" />
          WhatsApp Owner
        </a>
        <Button
          variant="outline"
          size="lg"
          iconLeft={<MessageCircle className="h-[18px] w-[18px]" />}
          className="w-full"
        >
          Message in chat
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink-200/70 pt-3 text-[12px] text-ink-500">
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          Posted by verified user
        </span>
        <span>{new Date(owner.joinedAt).getFullYear()}</span>
      </div>
    </motion.aside>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.5 3.5A11 11 0 0 0 3.6 17.3L2 22l4.9-1.5a11 11 0 0 0 5.1 1.3 11 11 0 0 0 8.5-18.3zM12 19.9c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-2.9.9.9-2.8-.2-.3a9 9 0 1 1 15.3-6.4 9 9 0 0 1-8.4 10zm5-6.8c-.3-.1-1.7-.8-2-.9s-.5-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1c-1.7-.8-2.8-1.5-4-3.3-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5L9 6c-.1-.2-.3-.2-.5-.2h-.4c-.2 0-.5.1-.7.3-.3.3-1 .9-1 2.3s1 2.7 1.1 2.9c.1.2 2 3.1 4.8 4.4 1.7.7 2.4.8 3.2.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
    </svg>
  );
}
