# AapKaPlot — Performance Optimization Plan

> Codebase-specific roadmap. All recommendations target the actual files and
> bottlenecks in this repo (Next.js 15 App Router, Prisma, Tailwind, PM2,
> Cloudflare Tunnel on Hostinger VPS).

---

## 0 · Current state

| Metric | Mobile | Desktop | Target |
|---|---|---|---|
| Performance | 41 | 48 | 80+ / 90+ |
| LCP | 11.01 s | 2.94 s | ≤ 2.5 s |
| INP | 11 281 ms | 3 905 ms | ≤ 200 ms |
| CLS | 0.000 | 0.000 | ✅ |
| TTFB | 82 ms | 51 ms | ✅ |
| FCP | 1.09 s | 0.28 s | ✅ |

**Diagnosis**: server is healthy (TTFB <100ms, FCP <300ms desktop). The
entire deficit is **client-side JavaScript** — parse, compile, hydrate,
animate. Mobile CPU is 6–10× slower than the M-series Mac in this office,
so what feels snappy in dev is a 10 s freeze on a real Redmi Note.

---

## 1 · Root cause analysis

### Why LCP is 11 s on mobile

1. **Hero is fully client-side** (`components/home/Hero.tsx`, `"use client"`).
   Until React hydrates and the bundle executes, the H1 is dark text on a
   white background — but until *recently* it was wrapped in `motion.h1`
   that started at `opacity: 0`. Lighthouse measures LCP at the moment the
   element is **painted with non-zero opacity**, so motion fade-ins are the
   #1 way to ruin LCP. (Fixed in commit `1e8ca11`.)
2. **MapPreview** is imported eagerly and renders above-the-fold on the
   right column at lg+. It fetches Mapbox tiles, parses GeoJSON, and runs
   `withinRadius()` math on every paint.
3. **Hero radial gradient + grid mask** are decorative SVG layers that
   trigger composite layers; not LCP-blocking but cost paint time.

### Why INP is 11 s on mobile

The first interaction (tap anywhere) blocks because the main thread is
busy:

1. **53 modules import `framer-motion`** — even with
   `optimizePackageImports`, each animated element pulls motion's reducers
   into the chunk. Combined parse/compile on a Redmi: ~600 ms.
2. **CookieConsent** mounts on first paint, uses Framer Motion enter
   animation, and reads `localStorage` synchronously.
3. **ServiceWorkerRegister** registers in `useEffect()` on first render
   and the worker `install` event blocks the main thread.
4. **GoogleAnalytics + GoogleAdSense** scripts were `afterInteractive`
   (fixed to `lazyOnload` in `1e8ca11`).
5. **Property page** (`/property/[id]`) ships **400 kB First Load JS** —
   image gallery, map, tabs, chat widget all hydrate even when not on
   screen.

### Why desktop INP is also bad (3.9 s)

Same JS, just faster CPU. Desktop INP > 200 ms is still in the "Poor"
range; the floor is the bundle size and hydration cost, not network.

---

## 2 · Top 15 wins (ordered by impact ÷ effort)

| # | Win | Effort | Expected gain | Status |
|---|---|---|---|---|
| 1 | GA + AdSense → `lazyOnload` | 5 min | INP −3 to −5 s | ✅ shipped |
| 2 | Below-fold sections via `next/dynamic` | 15 min | INP −2 s, JS −40 kB | ✅ shipped |
| 3 | Drop `framer-motion` from above-the-fold hero text | 10 min | LCP −1 s | ✅ shipped |
| 4 | Hero into **SSR shell + tiny client island** | 1 hr | LCP −2 to −3 s | ⏳ next |
| 5 | `MapPreview` → `dynamic(... { ssr: false })` with skeleton | 20 min | LCP −2 s | ⏳ |
| 6 | Defer `CookieConsent` mount to `requestIdleCallback` | 15 min | INP −1 to −2 s | ⏳ |
| 7 | Defer `ServiceWorkerRegister` to `window.load + 2s` | 5 min | INP −500 ms | ⏳ |
| 8 | Lazy-load `CompareDock` (only mount when compare ≥ 1 item) | 15 min | INP −300 ms | ⏳ |
| 9 | Property page tabs — only hydrate active tab | 45 min | Property page JS 400→260 kB | ⏳ |
| 10 | Replace `framer-motion` fade-ins with Tailwind `animate-fade-in` | 1 hr | bundle −25 kB gzipped | ⏳ |
| 11 | `priority` prop on hero images, `loading="lazy"` everywhere else | 10 min | LCP −500 ms | ⏳ |
| 12 | `font-display: swap` + preload only Inter 600 / Plus Jakarta 700 | 10 min | FCP −300 ms | ⏳ |
| 13 | Cloudflare Tunnel: enable Brotli (verify, likely on) | 5 min | Transfer size −30 % | check |
| 14 | Prisma `connection_limit=5` + pgbouncer to avoid cold-start | 10 min | TTFB tail latency −200 ms | ⏳ |
| 15 | Disable RouteProgress on initial nav (only on subsequent) | 5 min | TBT −150 ms | ⏳ |

Items 1–3 are already on `main` (deploy `1e8ca11`). Re-running the audit
should show mobile Performance ≈ 60–70 already.

---

## 3 · Implementation roadmap (5 PRs)

### PR-A: Hero as SSR shell + interactivity island

**Why**: above-the-fold should ship as static HTML. Currently every visitor
parses + hydrates `Hero.tsx` + its 6 dependencies before they can see the
H1 sharply.

**Plan**:

```
components/home/Hero.tsx                # NOW: "use client" — REWRITE as server
components/home/HeroIsland.tsx          # NEW: tiny "use client" for SearchPanel + geo button
components/home/MapPreview.tsx          # already client — wrap in dynamic() from page.tsx
```

```tsx
// app/page.tsx
const Hero = ... // server component now
const MapPreview = nextDynamic(
  () => import("@/components/home/MapPreview").then(m => ({ default: m.MapPreview })),
  { ssr: false, loading: () => <div className="aspect-[4/3] rounded-2xl bg-ink-100/60 animate-pulse" /> }
);
```

```tsx
// components/home/Hero.tsx — server component
import { HeroIsland } from "./HeroIsland";
import { MapPreview } from "./MapPreview"; // imported but rendered via dynamic from page
export function Hero({ children }: { children: React.ReactNode /* the map slot */ }) {
  return (
    <section className="...">
      <h1>...</h1>                  {/* static, in HTML on first byte */}
      <HeroIsland />                {/* tiny client island */}
      {children}                    {/* MapPreview placeholder */}
    </section>
  );
}
```

**Gain**: LCP painted from HTML stream; mobile LCP 11 s → ~3.5 s.

### PR-B: Lazy-hydrate global widgets in root layout

**Why**: `CookieConsent`, `CompareDock`, `ServiceWorkerRegister` mount on
every page and run framer-motion / localStorage / sw-register synchronously
on first paint. They should wait until the browser is idle.

```tsx
// components/layout/LazyClient.tsx (NEW)
"use client";
import { useEffect, useState } from "react";

/** Mounts children only after the browser is idle (or fallback to 2s). */
export function LazyClient({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const cb = () => setShow(true);
    if ("requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(cb, { timeout: 2000 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const t = setTimeout(cb, 2000);
    return () => clearTimeout(t);
  }, []);
  return show ? <>{children}</> : null;
}
```

```tsx
// app/layout.tsx
<LazyClient>
  <CookieConsent />
  <CompareDock />
  <ServiceWorkerRegister />
</LazyClient>
```

**Gain**: INP −1 to −2 s. None of these widgets are needed in the first
2 s of a session.

### PR-C: framer-motion → Tailwind for fade-ins

**Why**: 53 modules import motion. Most use is `opacity:0 → 1, y:12 → 0`
for fade-in-on-mount. Pure CSS does this in zero JS.

```css
/* app/globals.css */
@keyframes akp-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.akp-fade-in { animation: akp-fade-in 350ms ease-out both; }
```

```diff
- <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
+ <div className="akp-fade-in">
```

Codemod via `grep -l "motion.div" app components | xargs sed ...` plus
manual review of the genuinely interactive ones (`AnimatePresence`,
`drag`, `whileHover`). Aim to keep motion only in: dashboards (admin),
chat, drag-and-drop.

**Gain**: shared bundle −25 to −30 kB gzipped, TBT −600 ms on mobile.

### PR-D: Property page surgery

The `/property/[id]` route ships **400 kB First Load JS** — 4× any other
route. Likely causes:

- Image gallery component eagerly imports all images
- 5+ tabs (Description, Location, Amenities, Reviews, Similar) hydrate up-front
- Embedded chat widget hydrates even when CTA unclicked

Plan:
1. **Image gallery**: `dynamic()` with `ssr: false`, mount on first `IntersectionObserver` trigger.
2. **Tabs**: only render the active panel's content. Inactive panels lazy-render on tab-click.
3. **Map**: same `dynamic({ ssr: false })` treatment as hero.
4. **"Similar properties"**: move below-the-fold, dynamic import.

**Gain**: First Load JS 400 → 250 kB. Property page LCP −2 s.

### PR-E: Image + font polish

```tsx
// next.config.ts — add deviceSizes/imageSizes pinned to actual breakpoints
images: {
  formats: ["image/avif", "image/webp"],
  deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],
  imageSizes: [64, 128, 256, 384],
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
}
```

Hero image, listing card[0] in nearby rail → `priority` prop. Below-fold
cards → leave default (lazy). Verify `sizes=` is set everywhere (currently
missing on FloatingPropertyCard, HomepageAdSlot).

Fonts — already `next/font` with `display: swap`. Add `preload: true` only
to the **single weight** used in H1 (Plus Jakarta 700). Others — drop
`preload`.

**Gain**: LCP −300 to −500 ms, transfer −80 kB.

---

## 4 · Server-side & infra (lower priority — TTFB is fine)

Skip unless metrics show server stress.

### Prisma + Postgres

- TTFB is 51–82 ms — DB is **not** the bottleneck. Don't over-engineer.
- Single tweak: set `?connection_limit=5&pool_timeout=20` in `DATABASE_URL`
  to cap connections (PM2 fork mode can otherwise exhaust the pool).
- Add indexes only where slow queries appear in `pg_stat_statements`. Real
  estate queries on `city, state, kind, intent` would benefit if the
  homepage query plan shows seq-scans — but the current home query path
  uses small enough tables that it's not the issue.

### Cloudflare Tunnel

- Brotli is enabled by Cloudflare automatically for HTML/CSS/JS/JSON.
  Verify with `curl -H "Accept-Encoding: br" -I https://aapkaplot.com/`.
- Add `Cache-Control: public, s-maxage=60, stale-while-revalidate=600` on
  the SSR routes that don't depend on the session (homepage with
  `export const dynamic = "force-dynamic"` currently — relax to default
  caching, or keep dynamic but add `revalidate=60`).

### PM2

- Currently `fork` mode, single process. Migration to `cluster` with
  `instances: max` would double throughput **only if** request rate is the
  bottleneck (Cloudflare's analytics will tell). For current traffic
  (~handful of QPS), single process is fine.
- Run `pm2 update` once (the warning in deploy log). Non-urgent.

### Ubuntu / VPS

- TTFB 50 ms → already fine. No changes.
- Don't touch vidyt's processes (per [[feedback_vidyt_coexistence]]).

---

## 5 · Critical mistakes currently in the codebase

1. ~~`afterInteractive` for GA/AdSense~~ **fixed**.
2. **Hero is "use client"** — entire above-the-fold needs JS to paint.
3. **`force-dynamic` on `/` homepage** — every request re-renders, no edge
   cache. Should be `revalidate = 60` unless USE_DB toggle is changing.
4. **No `priority` prop** on any image — Next.js can't preload the LCP image.
5. **`useDeviceLocation` runs on Hero mount** — geolocation prompt + state
   update during initial paint. Move to user-triggered (button click).
6. **53 framer-motion imports for fade-ins** — pay 30 kB for what CSS gives
   free.
7. **Service worker registers eagerly** — SW `install` event blocks main
   thread for 200–500 ms on first visit.
8. **No bundle analyzer in CI** — perf regressions ship silently.

---

## 6 · Fastest path to Lighthouse 90+

Realistic per-device targets after all 5 PRs:

| | Mobile | Desktop |
|---|---|---|
| Performance | **75–82** | **90–95** |
| LCP | **2.5–3.5 s** | **1.5–2 s** |
| INP | **300–600 ms** | **150–300 ms** |

Mobile 90+ on a property-listing site with maps, ads, and image galleries
is genuinely hard. The realistic floor is 80; anyone claiming 95 on mobile
is hiding the carousel or shipping a 50 kB total bundle. The honest target
is **80 mobile / 95 desktop**.

To get the **last 5 points to mobile 85+**:
- Replace Mapbox tiles with a static screenshot for above-the-fold
- Self-host Inter + Plus Jakarta via `local()` fonts (skip the Google CDN
  round-trip)
- AVIF-encode property images server-side with `sharp` before upload to
  ImgBB (the CDN ones aren't AVIF)
- Service worker pre-cache for repeat visits — bumps Perf by ~10 on
  return-visitor runs (Lighthouse simulates a first visit by default, but
  field data improves)

---

## 7 · High-impact, minimal-code fixes (≤ 20 LoC each)

1. `LazyClient` wrapper in root layout for CookieConsent + CompareDock + SW
2. `dynamic({ ssr: false })` for MapPreview
3. `priority` prop on first listing card in NearbyRail + Hero map
4. Drop `force-dynamic` from `/`, add `export const revalidate = 60`
5. Move `withinRadius` slice computation out of render — `useMemo` it

---

## 8 · Production checklist (before every deploy)

- [ ] `npm run build` locally — no new warnings, no First Load JS > 250 kB
      on common routes
- [ ] Lighthouse run on `/` and one `/property/[id]` page — Perf not lower
      than previous deploy
- [ ] `next/image` for every new `<img>`
- [ ] No new `"use client"` in `app/**/page.tsx` (pages must be server)
- [ ] No new `framer-motion` import unless interactive (drag, gesture)
- [ ] All new env vars added to `.env.example` with comment
- [ ] No console.log in production code paths
- [ ] Sourcemaps disabled in prod build (`productionBrowserSourceMaps: false` — default)

---

## 9 · Monitoring (post-deploy)

Skip Sentry/OpenTelemetry until perf is good — those tools add 20–40 kB to
every page. Use instead:

- **Cloudflare Web Analytics** (free, no JS) for Core Web Vitals field
  data
- **Vercel Speed Insights** if you ever move to Vercel
- For now, **rerun `/admin/performance`** weekly and log to the existing
  `PerformanceScan` table — you already have the audit infra

---

## 10 · Codebase rules going forward

1. **Pages are server components.** A page with `"use client"` is a bug.
2. **Hooks belong in islands.** `useState`, `useEffect`, etc. live in
   small client components named `*Island.tsx` or `*Client.tsx`.
3. **No animation library above the fold.** Tailwind keyframes only for
   above-the-fold; Framer Motion is fine in admin / interactive areas.
4. **`dynamic({ ssr: false })` is the default** for anything heavy:
   maps, charts, galleries, editors.
5. **Image priority is intentional.** Exactly one `priority` per route —
   the LCP element.
6. **Every new route ships under 200 kB First Load JS.** If the build
   complains, split it.
