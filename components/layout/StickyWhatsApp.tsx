/**
 * Floating WhatsApp pill — bottom-right on every page.
 * Tap to open WhatsApp with a pre-filled message including the
 * current page URL so the receiver knows the context.
 */
"use client";

import { useEffect, useState } from "react";

const PHONE = "917039125391"; // matches the footer number

export function StickyWhatsApp() {
  const [href, setHref] = useState(`https://wa.me/${PHONE}`);

  useEffect(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = encodeURIComponent(`Hi AapKaPlot, I'd like to know more about a property.\n\nPage: ${url}`);
    setHref(`https://wa.me/${PHONE}?text=${text}`);
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with AapKaPlot on WhatsApp"
      className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lift hover:brightness-110 active:scale-95 transition"
    >
      <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
        <path d="M16.001 3C9.373 3 4 8.373 4 15.001c0 2.295.652 4.512 1.886 6.434L4 28l6.74-1.83a11.92 11.92 0 0 0 5.262 1.252c6.628 0 12.001-5.374 12.001-12.002C28.003 8.373 22.629 3 16.001 3zm6.969 16.953c-.293.823-1.731 1.575-2.388 1.66-.609.077-1.38.11-2.225-.139-.512-.155-1.176-.376-2.022-.74-3.556-1.534-5.875-5.117-6.051-5.351-.176-.234-1.45-1.927-1.45-3.677 0-1.75.918-2.61 1.244-2.965.293-.323.704-.405.939-.405l.675.012c.216.011.504-.083.789.602.293.704.997 2.426 1.085 2.601.088.176.146.382.029.616-.117.234-.176.382-.351.586-.176.205-.371.458-.529.616-.176.176-.359.367-.154.72.205.351.916 1.51 1.967 2.443 1.352 1.2 2.494 1.572 2.846 1.748.352.176.557.146.762-.088.205-.234.879-1.025 1.114-1.379.234-.352.469-.293.789-.176.323.117 2.046.967 2.397 1.143.352.176.586.264.674.41.088.146.088.846-.205 1.668z"/>
      </svg>
      <span className="hidden sm:inline text-sm font-semibold">Chat on WhatsApp</span>
    </a>
  );
}
