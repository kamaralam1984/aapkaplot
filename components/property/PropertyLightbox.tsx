"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface PropertyLightboxProps {
  images: string[];
  alt: string;
  /** Render prop — the host controls the trigger (e.g. wrap a thumbnail). */
  trigger: (open: () => void) => React.ReactNode;
  /** Optional initial index when opened. */
  initialIndex?: number;
}

/**
 * Full-screen, keyboard-navigable image lightbox for property galleries.
 *
 * Behaviour:
 *  • Esc closes.
 *  • ← / → cycle.
 *  • Backdrop click closes; modal click doesn't bubble.
 *  • Pinch-zoom and pan are left to the browser via `touch-action: pinch-zoom`
 *    on the image so mobile users can inspect plot photos.
 */
export function PropertyLightbox({ images, alt, trigger, initialIndex = 0 }: PropertyLightboxProps) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(initialIndex);

  const close = useCallback(() => setOpen(false), []);
  const next = useCallback(
    () => setIdx((i) => (images.length === 0 ? 0 : (i + 1) % images.length)),
    [images.length],
  );
  const prev = useCallback(
    () => setIdx((i) => (images.length === 0 ? 0 : (i - 1 + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, next, prev]);

  const safeImages = images.filter((u) => typeof u === "string" && u.length > 0);

  return (
    <>
      {trigger(() => {
        setIdx(Math.min(initialIndex, Math.max(0, safeImages.length - 1)));
        setOpen(true);
      })}

      {open && safeImages.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} — image ${idx + 1} of ${safeImages.length}`}
          onClick={close}
          className="fixed inset-0 z-[200] grid place-items-center bg-black/92 p-4"
        >
          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3 text-white/90">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[12.5px] font-semibold backdrop-blur">
              {idx + 1} / {safeImages.length}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); close(); }}
              aria-label="Close gallery"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Prev / next buttons (≥ sm) */}
          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20 sm:grid"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20 sm:grid"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Main image */}
          <div
            className="relative h-[80vh] w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
            style={{ touchAction: "pinch-zoom" }}
          >
            <Image
              key={idx}
              src={safeImages[idx]}
              alt={`${alt} — ${idx + 1}`}
              fill
              sizes="100vw"
              priority
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Thumbnail strip */}
          {safeImages.length > 1 && (
            <div
              className="absolute inset-x-0 bottom-3 z-10 mx-auto flex max-w-full justify-start gap-1.5 overflow-x-auto px-4 sm:justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {safeImages.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Image ${i + 1}`}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                    i === idx ? "ring-emerald-400" : "ring-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/** Standalone trigger button — for cases where the host wants a simple
 *  "View gallery" CTA rather than wrapping a thumbnail. */
export function LightboxFab({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black/55 px-3 text-[12px] font-semibold text-white backdrop-blur transition hover:bg-black/75"
    >
      <Maximize2 className="h-3.5 w-3.5" />
      View all
    </button>
  );
}
