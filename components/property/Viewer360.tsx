"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Move, RotateCw } from "lucide-react";

/**
 * Lightweight 360° viewer placeholder. Drag horizontally to rotate the panorama.
 * Real implementation will swap the gradient backdrop for a sequence of frames
 * from Cloudinary (e.g. /frame_001.jpg … frame_036.jpg).
 */
interface Viewer360Props {
  /** Optional list of frame URLs (1–36 frames). If provided, drag scrubs them. */
  frames?: string[];
  /** Fallback hero image used when no frames are supplied. */
  fallbackUrl?: string;
}

export function Viewer360({ frames, fallbackUrl }: Viewer360Props) {
  const [angle, setAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const lastXRef = useRef(0);
  const frameCount = frames?.length ?? 36;

  // Demo: gently auto-rotate when not dragging.
  useEffect(() => {
    if (dragging) return;
    const i = setInterval(() => setAngle((a) => (a + 1.2) % 360), 70);
    return () => clearInterval(i);
  }, [dragging]);

  const frameIdx = Math.floor((angle / 360) * frameCount) % frameCount;
  const currentFrame = frames?.[frameIdx];

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    lastXRef.current = e.clientX;
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    setAngle((a) => (a + dx * 0.6 + 360) % 360);
  };
  const onPointerUp = () => setDragging(false);

  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden bg-ink-900">
      <div
        role="img"
        aria-label="360 degree property view"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="absolute inset-0 cursor-ew-resize touch-pan-y select-none"
        style={
          currentFrame
            ? {
                backgroundImage: `url(${currentFrame})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }
            : {
                backgroundImage:
                  "linear-gradient(120deg,#0f172a 0%, #1e293b 35%, #064e3b 70%, #047857 100%)",
                backgroundPosition: `${(angle / 360) * 100}% 50%`,
                backgroundSize: "300% 100%",
              }
        }
      >
        {/* Subtle compass ring */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-4">
          <div className="flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
            <RotateCw className="h-3 w-3" />
            {Math.round(angle)}°
          </div>
        </div>
      </div>

      {/* Onboarding hint */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: dragging ? 0 : 1, y: dragging ? 8 : 0 }}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-semibold text-ink-800 shadow-lift backdrop-blur-md"
      >
        <span className="inline-flex items-center gap-1.5">
          <Move className="h-3.5 w-3.5" /> Drag to look around
        </span>
      </motion.div>

      {/* Top-left badge */}
      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-violet-500/95 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white shadow-soft">
        360° View
      </span>
    </div>
  );
}
