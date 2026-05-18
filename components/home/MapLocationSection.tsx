/**
 * Interactive map showcase — uses OpenStreetMap tile preview from
 * staticmap.openstreetmap.de (free, no key) as the static thumbnail,
 * with overlay chips for nearby amenities.
 *
 * Live map interaction happens on /search where MapLibre is mounted.
 */
import Link from "next/link";

interface Pin { label: string; icon: string; color: string }

const PINS: Pin[] = [
  { label: "Schools",       icon: "🏫", color: "bg-emerald-50 text-emerald-700" },
  { label: "Hospitals",     icon: "🏥", color: "bg-rose-50 text-rose-700" },
  { label: "Metro / Rail",  icon: "🚇", color: "bg-indigo-50 text-indigo-700" },
  { label: "Markets",       icon: "🛒", color: "bg-amber-50 text-amber-800" },
  { label: "Highways",      icon: "🛣", color: "bg-teal-50 text-teal-700" },
  { label: "Parks",         icon: "🌳", color: "bg-emerald-50 text-emerald-700" },
];

export function MapLocationSection() {
  // Free OSM tile preview centred on Patna; replaced by live MapLibre on /search.
  const previewUrl = "https://staticmap.openstreetmap.de/staticmap.php?center=25.594,85.137&zoom=12&size=900x500&maptype=mapnik";

  return (
    <section className="py-14 sm:py-20 bg-ink-50/40">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-[1fr_400px] items-center">
          <div className="relative rounded-3xl overflow-hidden ring-1 ring-ink-200/70 shadow-lift">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Map of Patna showing nearby amenities — schools, hospitals, transport"
              className="w-full h-[260px] sm:h-[440px] object-cover"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-emerald-900/15 via-transparent to-indigo-900/10" />
            {/* sample pins floating on map */}
            <span className="absolute top-[28%] left-[30%] grid h-9 w-9 place-items-center rounded-full bg-white shadow-lift text-base">🏫</span>
            <span className="absolute top-[48%] left-[55%] grid h-9 w-9 place-items-center rounded-full bg-white shadow-lift text-base">🏥</span>
            <span className="absolute top-[68%] left-[40%] grid h-9 w-9 place-items-center rounded-full bg-white shadow-lift text-base">🚇</span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Smart location intelligence</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-display font-semibold text-ink-900">
              Know the neighbourhood before you visit
            </h2>
            <p className="mt-3 text-ink-700 leading-relaxed">
              Every listing shows nearby schools, hospitals, markets, public transit and major roads — pulled live from OpenStreetMap. You decide if the address really fits your life, not just your budget.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {PINS.map((p) => (
                <div key={p.label} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${p.color}`}>
                  <span className="text-base">{p.icon}</span>
                  <span>{p.label}</span>
                </div>
              ))}
            </div>

            <Link href="/search" className="mt-6 inline-flex rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:brightness-105">
              Open interactive map →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
