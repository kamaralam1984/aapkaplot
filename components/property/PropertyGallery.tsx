"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Grid3x3,
  Image as ImageIcon,
  Map as MapIcon,
  Play,
  Satellite,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { Viewer360 } from "./Viewer360";
import { InteractiveMap } from "@/components/maps/InteractiveMap";
import { RotateCw } from "lucide-react";

type Tab = "photos" | "video" | "satellite" | "map" | "tour" | "360";

interface PropertyGalleryProps {
  gallery: string[];
  videoUrl?: string;
  youtubeUrl?: string;
  panoFrames?: string[];
  satelliteUrl?: string | null;
  title: string;
  lat: number;
  lng: number;
}

export function PropertyGallery({
  gallery,
  videoUrl,
  youtubeUrl,
  panoFrames,
  satelliteUrl,
  title,
  lat,
  lng,
}: PropertyGalleryProps) {
  const [tab, setTab] = useState<Tab>("photos");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const tabs = useMemo(() => {
    const all: { id: Tab; label: string; icon: React.ReactNode }[] = [
      { id: "photos", label: `Photos · ${gallery.length}`, icon: <ImageIcon className="h-3.5 w-3.5" /> },
    ];
    if (videoUrl) all.push({ id: "video", label: "Video", icon: <Play className="h-3.5 w-3.5" /> });
    if (youtubeUrl) all.push({ id: "tour", label: "Video tour", icon: <Play className="h-3.5 w-3.5" /> });
    all.push({ id: "360", label: "360°", icon: <RotateCw className="h-3.5 w-3.5" /> });
    all.push({ id: "satellite", label: "Satellite", icon: <Satellite className="h-3.5 w-3.5" /> });
    all.push({ id: "map", label: "Map", icon: <MapIcon className="h-3.5 w-3.5" /> });
    return all;
  }, [gallery.length, videoUrl, youtubeUrl]);

  return (
    <section className="relative">
      {/* Desktop grid + mobile carousel */}
      <div className="grid h-[300px] grid-cols-1 gap-2 sm:h-[420px] sm:grid-cols-4 sm:grid-rows-2 lg:h-[480px]">
        {/* Main image */}
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="relative col-span-1 row-span-2 overflow-hidden rounded-2xl sm:col-span-2"
        >
          <Image
            src={gallery[0]}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          {/* Tab bar overlay */}
          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <span
                key={t.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (t.id === "photos") setLightboxIndex(0);
                  else setTab(t.id);
                }}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold backdrop-blur-md transition",
                  tab === t.id
                    ? "bg-white text-ink-900 shadow-soft"
                    : "bg-black/40 text-white/95 hover:bg-black/55"
                )}
              >
                {t.icon}
                {t.label}
              </span>
            ))}
          </div>
        </button>

        {/* Thumbs */}
        {gallery.slice(1, 5).map((src, i) => {
          const isLastVisible = i === 3 && gallery.length > 5;
          return (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setLightboxIndex(i + 1)}
              className="relative hidden overflow-hidden rounded-2xl sm:block"
            >
              <Image
                src={src}
                alt={`${title} – ${i + 2}`}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover transition-transform duration-500 hover:scale-[1.04]"
              />
              {isLastVisible && (
                <div className="absolute inset-0 grid place-items-center bg-black/55 text-white">
                  <div className="flex flex-col items-center gap-1">
                    <Grid3x3 className="h-5 w-5" />
                    <span className="text-[13px] font-semibold">+{gallery.length - 5} photos</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Expand button */}
      <button
        type="button"
        onClick={() => setLightboxIndex(0)}
        className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 text-[12.5px] font-semibold text-ink-800 shadow-card backdrop-blur-sm transition hover:bg-white"
      >
        <Expand className="h-3.5 w-3.5" />
        View all photos
      </button>

      {/* Below-fold media surface for non-photo tabs */}
      <AnimatePresence mode="wait">
        {tab !== "photos" && (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="mt-3 overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-soft"
          >
            {tab === "satellite" && (
              <SatelliteFrame lat={lat} lng={lng} fallback={satelliteUrl ?? null} />
            )}
            {tab === "map" && <MapFrame lat={lat} lng={lng} />}
            {tab === "video" && videoUrl && (
              <video
                src={videoUrl}
                controls
                className="aspect-video w-full bg-black"
              />
            )}
            {tab === "tour" && youtubeUrl && (
              <YouTubeEmbed url={youtubeUrl} title={`${title} video tour`} />
            )}
            {tab === "360" && (
              <Viewer360 frames={panoFrames} fallbackUrl={gallery[0]} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Lightbox
        images={gallery}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        title={title}
      />
    </section>
  );
}

function SatelliteFrame({ lat, lng, fallback }: { lat: number; lng: number; fallback: string | null }) {
  // Esri satellite raster via MapLibre — free, no token.
  return (
    <div className="aspect-[2/1] w-full overflow-hidden bg-ink-900">
      <InteractiveMap
        center={{ lat, lng }}
        zoom={16}
        origin={{ lat, lng }}
        view="satellite"
        interactive
        className="absolute inset-0"
        fallback={
          fallback ? (
            <img src={fallback} alt="Satellite view" className="aspect-[2/1] w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-white/80">
              <Satellite className="h-10 w-10 opacity-50" />
            </div>
          )
        }
      />
    </div>
  );
}

function MapFrame({ lat, lng }: { lat: number; lng: number }) {
  // MapLibre + OpenFreeMap — free, no token.
  return (
    <div className="aspect-[2/1] w-full overflow-hidden">
      <InteractiveMap
        center={{ lat, lng }}
        zoom={15}
        origin={{ lat, lng }}
        view="map"
        interactive
        className="absolute inset-0"
        fallback={
          <div className="dot-grid grid h-full w-full place-items-center bg-emerald-50/40 text-ink-500">
            <MapIcon className="h-10 w-10 opacity-40" />
          </div>
        }
      />
    </div>
  );
}

function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
  title,
}: {
  images: string[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  title: string;
}) {
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, images.length, onClose, onIndexChange]);

  return (
    <AnimatePresence>
      {index !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
            aria-label="Previous"
            className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => onIndexChange((index + 1) % images.length)}
            aria-label="Next"
            className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="relative h-full w-full max-w-6xl"
          >
            <Image
              src={images[index]}
              alt={`${title} – ${index + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </motion.div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white">
            {index + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
