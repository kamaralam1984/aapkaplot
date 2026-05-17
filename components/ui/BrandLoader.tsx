/**
 * Full-page branded loader used by route-level loading.tsx files.
 *
 * Looks like a "VFX" splash:
 *   • Rotating circular text "AAP KA PLOT • AAP KA PLOT" on the outer rim
 *   • Two counter-rotating gradient arc rings
 *   • Pulsing gradient halo behind a centered "A" brand badge
 *   • Breathing tagline + shimmer track at the bottom
 *
 * Pure CSS animations — no framer-motion — so this is cheap to mount during
 * route transitions. Respects prefers-reduced-motion via globals.css.
 */
export function BrandLoader({ label = "Loading AapKaPlot…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white/85 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="relative h-44 w-44">
          {/* Soft pulsing halo behind everything */}
          <span
            aria-hidden
            className="brand-loader-halo absolute inset-4 rounded-full bg-brand-gradient opacity-25 blur-2xl"
          />

          {/* Rotating circular wordmark — SVG textPath traces the outer ring */}
          <svg
            viewBox="0 0 200 200"
            className="brand-loader-textring absolute inset-0 h-full w-full"
            aria-hidden
          >
            <defs>
              <path
                id="akp-loader-circle"
                d="M 100,100 m -82,0 a 82,82 0 1,1 164,0 a 82,82 0 1,1 -164,0"
                fill="none"
              />
              <linearGradient id="akp-loader-text-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
            <text
              fill="url(#akp-loader-text-grad)"
              style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: 6 }}
            >
              <textPath href="#akp-loader-circle" startOffset="0">
                AAP KA PLOT • AAP KA PLOT • AAP KA PLOT •
              </textPath>
            </text>
          </svg>

          {/* Outer gradient arc ring (clockwise) */}
          <span
            aria-hidden
            className="brand-loader-ring-cw absolute inset-7 rounded-full border-[2.5px] border-transparent"
            style={{
              borderTopColor: "rgb(99,102,241)",
              borderRightColor: "rgb(16,185,129)",
            }}
          />

          {/* Inner gradient arc ring (counter-clockwise) */}
          <span
            aria-hidden
            className="brand-loader-ring-ccw absolute inset-11 rounded-full border-[2.5px] border-transparent"
            style={{
              borderBottomColor: "rgb(244,114,182)",
              borderLeftColor: "rgb(245,158,11)",
            }}
          />

          {/* Brand badge in the dead center */}
          <div className="brand-loader-badge absolute inset-0 m-auto grid h-14 w-14 place-items-center self-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <span className="font-display text-lg font-bold">A</span>
          </div>
        </div>

        <p className="brand-loader-breathe mt-7 text-[13.5px] font-semibold tracking-wide text-ink-700">
          {label}
        </p>

        <div className="mt-3 h-1 w-40 overflow-hidden rounded-full bg-ink-100">
          <span className="brand-loader-track block h-full w-1/3 rounded-full bg-brand-gradient" />
        </div>
      </div>
    </div>
  );
}
