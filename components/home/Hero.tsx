"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Home, BadgeCheck, Satellite, Crosshair, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { SearchPanel } from "./SearchPanel";
import { MapPreview } from "./MapPreview";
import { FloatingPropertyCard } from "./FloatingPropertyCard";
import { GpsConsentBanner } from "./GpsConsentBanner";
import { HERO_STATS, MOCK_PROPERTIES, DEFAULT_ORIGIN } from "@/lib/mock-data";
import { withinRadius } from "@/lib/haversine";
import { useT } from "@/lib/i18n";

const ICONS: Record<string, React.ReactNode> = {
  home: <Home className="h-[18px] w-[18px]" />,
  sparkles: <Sparkles className="h-[18px] w-[18px]" />,
  "badge-check": <BadgeCheck className="h-[18px] w-[18px]" />,
  satellite: <Satellite className="h-[18px] w-[18px]" />,
};

export function Hero() {
  const [isLocating, setIsLocating] = useState(false);
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const { t } = useT();

  const nearby = withinRadius(origin, MOCK_PROPERTIES, 200).slice(0, 6);

  const handleLocate = () => {
    if (!("geolocation" in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <section className="relative overflow-hidden bg-hero-radial">
      {/* Decorative grid */}
      <div className="absolute inset-0 grid-mask opacity-60" aria-hidden />
      <Container
        size="wide"
        className="relative flex min-h-[calc(100dvh-64px)] flex-col justify-center pb-10 pt-6 lg:pb-16 lg:pt-10"
      >
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] xl:gap-12 2xl:gap-16">
          {/* Left: copy + search */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t("hero.eyebrow")}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-5 text-display-xl text-balance font-display text-ink-900"
            >
              {t("hero.h1.1")}
              <br className="hidden sm:block" /> {t("hero.h1.2")}{" "}
              <span className="text-gradient-brand">{t("hero.h1.3")}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-ink-600"
            >
              {t("hero.sub")}
            </motion.p>

            {/* Search */}
            <div className="mt-7">
              <SearchPanel onLocate={handleLocate} isLocating={isLocating} />
            </div>

            {/* Secondary CTAs */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant="soft"
                size="md"
                onClick={handleLocate}
                iconLeft={<Crosshair className="h-4 w-4" />}
              >
                {t("hero.cta.explore")}
              </Button>
              <Link href="/sell/new">
                <Button variant="outline" size="md" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t("hero.cta.post")}
                </Button>
              </Link>
            </div>

            {/* Stats / trust row */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {HERO_STATS.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.06 }}
                  className="flex items-center gap-3 rounded-2xl border border-ink-200/70 bg-white p-3 shadow-soft"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    {ICONS[s.icon]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold leading-tight text-ink-900">
                      {s.value}
                    </p>
                    <p className="truncate text-[11.5px] text-ink-500">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: map preview + floating cards */}
          <div className="relative">
            <MapPreview properties={nearby} />
            {/* Floating property cards — clamped inside the column so they
                never cause horizontal overflow on any viewport. */}
            {nearby[0] && (
              <FloatingPropertyCard
                property={nearby[0]}
                position={{ bottom: "10%", left: "2%" }}
                delay={0.4}
                className="hidden xl:block"
              />
            )}
            {nearby[1] && (
              <FloatingPropertyCard
                property={nearby[1]}
                position={{ top: "28%", right: "2%" }}
                delay={0.6}
                className="hidden xl:block"
              />
            )}
          </div>
        </div>
      </Container>

      {/* Auto GPS consent (once per browser) */}
      <GpsConsentBanner onAllow={handleLocate} />
    </section>
  );
}
