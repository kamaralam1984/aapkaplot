"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Megaphone, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";

const ADS = [
  {
    id: "ad-newtown",
    advertiser: "Anik Builders",
    title: "Premium 3BHK launch at New Town",
    subtitle: "Starting ₹68 L · 0% EMI for 6 months",
    cta: "View project",
    href: "/property/p_003",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=70",
  },
  {
    id: "ad-rajarhat",
    advertiser: "Sunshine Developers",
    title: "Smart plots in Rajarhat — RERA approved",
    subtitle: "From ₹9.5 L · Festive offer ends Sunday",
    cta: "Reserve a plot",
    href: "/property/p_007",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=70",
  },
];

export function HomepageAdSlot() {
  return (
    <section className="mt-12 lg:mt-16">
      <Container size="wide">
        <div className="mb-3 flex items-end justify-between">
          <div className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-ink-500">
            <Megaphone className="h-3.5 w-3.5 text-brand-500" />
            Sponsored partners
          </div>
          <Link
            href="/pricing"
            className="text-[12.5px] font-semibold text-brand-600 hover:underline"
          >
            Advertise with us →
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {ADS.map((ad, i) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="surface-card group relative isolate overflow-hidden"
            >
              <Link href={ad.href} className="absolute inset-0 z-[2]" aria-label={ad.title} />
              <div className="relative aspect-[16/7] w-full overflow-hidden bg-ink-100">
                <Image
                  src={ad.image}
                  alt={ad.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  Ad · {ad.advertiser}
                </span>
                <div className="absolute inset-y-0 left-0 flex flex-col justify-end p-5 text-white">
                  <p className="text-[18px] font-bold leading-tight drop-shadow">{ad.title}</p>
                  <p className="mt-1 text-[12.5px] text-white/90">{ad.subtitle}</p>
                </div>
                <span className="absolute bottom-4 right-4 z-[3] inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-ink-900 shadow-card">
                  {ad.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
