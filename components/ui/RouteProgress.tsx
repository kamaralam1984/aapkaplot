"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Top-of-page progress bar that pulses every time the pathname or query
 * string changes. Pure CSS animation, framer-free for minimum overhead.
 *
 * Intercepts clicks on internal <a> elements so the bar appears immediately
 * even before Next.js starts the transition — feels snappier than waiting
 * for usePathname to update.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger on pathname/search change (route actually committed).
  useEffect(() => {
    setActive(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setActive(false), 600);
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, [pathname, search]);

  // Trigger immediately on internal link clicks so the bar feels instant.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest("a") as HTMLAnchorElement | null;
      if (!a) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      // Only intercept same-origin navigations.
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        return;
      }
      setActive(true);
      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(() => setActive(false), 1500);
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as never);
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden transition-opacity duration-200 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="route-progress-bar h-full w-1/3 bg-brand-gradient shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
    </div>
  );
}
