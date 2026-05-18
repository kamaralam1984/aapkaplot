import {
  Sparkles, Train, TrainFront, Plane, Hospital, School, GraduationCap,
  ShoppingBag, ShoppingCart, Utensils, Banknote, CreditCard, Shield,
  Fuel, Trees, Landmark, Building2,
} from "lucide-react";
import { fetchPropertyPois, type PoiCategory, type Poi, CATEGORY_ORDER, poiDistanceLabel } from "@/lib/property-poi";

interface PropertyAINearbyProps {
  lat: number;
  lng: number;
}

const META: Record<PoiCategory, { label: string; icon: React.ReactNode; tone: string }> = {
  metro:        { label: "Metro",           icon: <TrainFront className="h-4 w-4" />,  tone: "bg-violet-50 text-violet-700" },
  railway:      { label: "Railway",         icon: <Train className="h-4 w-4" />,        tone: "bg-violet-50 text-violet-700" },
  airport:      { label: "Airport",         icon: <Plane className="h-4 w-4" />,        tone: "bg-sky-50 text-sky-700" },
  hospital:     { label: "Hospital",        icon: <Hospital className="h-4 w-4" />,     tone: "bg-rose-50 text-rose-700" },
  school:       { label: "Schools",         icon: <School className="h-4 w-4" />,       tone: "bg-emerald-50 text-emerald-700" },
  college:      { label: "Colleges",        icon: <GraduationCap className="h-4 w-4" />,tone: "bg-emerald-50 text-emerald-700" },
  mall:         { label: "Malls",           icon: <ShoppingBag className="h-4 w-4" />,  tone: "bg-amber-50 text-amber-700" },
  supermarket:  { label: "Supermarkets",    icon: <ShoppingCart className="h-4 w-4" />, tone: "bg-amber-50 text-amber-700" },
  restaurant:   { label: "Restaurants",     icon: <Utensils className="h-4 w-4" />,     tone: "bg-amber-50 text-amber-700" },
  bank:         { label: "Banks",           icon: <Banknote className="h-4 w-4" />,     tone: "bg-emerald-50 text-emerald-700" },
  atm:          { label: "ATMs",            icon: <CreditCard className="h-4 w-4" />,   tone: "bg-emerald-50 text-emerald-700" },
  police:       { label: "Police",          icon: <Shield className="h-4 w-4" />,       tone: "bg-ink-100 text-ink-700" },
  fuel:         { label: "Petrol pumps",    icon: <Fuel className="h-4 w-4" />,         tone: "bg-ink-100 text-ink-700" },
  park:         { label: "Parks",           icon: <Trees className="h-4 w-4" />,        tone: "bg-emerald-50 text-emerald-700" },
  tourism:      { label: "Tourist spots",   icon: <Building2 className="h-4 w-4" />,    tone: "bg-sky-50 text-sky-700" },
  historical:   { label: "Heritage",        icon: <Landmark className="h-4 w-4" />,     tone: "bg-amber-50 text-amber-700" },
};

/**
 * Server component — fetches Overpass POIs around the property's lat/lng
 * and renders a category grid + AI-generated marketing highlights.
 *
 * Runs on every render but the underlying fetcher is heavily cached
 * (in-memory + 30-day Postgres row), so SSR latency is ~5-25 ms for warm
 * lookups, ~3-15 s on first hit for a new bucket.
 */
export async function PropertyAINearby({ lat, lng }: PropertyAINearbyProps) {
  const bundle = await fetchPropertyPois(lat, lng).catch(() => null);
  if (!bundle || bundle.items.length === 0) {
    return (
      <section className="surface-card overflow-hidden">
        <header className="flex items-center gap-3 border-b border-ink-200/70 bg-white/60 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h3 className="text-[15px] font-bold text-ink-900">What's around</h3>
            <p className="text-[12.5px] text-ink-500">
              We couldn't pull OpenStreetMap data for this location right now. Try refreshing in a minute.
            </p>
          </div>
        </header>
      </section>
    );
  }

  const presentCats = CATEGORY_ORDER.filter((c) => bundle.byCategory[c]?.length);

  return (
    <section className="surface-card overflow-hidden">
      <header className="flex items-start gap-3 border-b border-ink-200/70 bg-white/60 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
          <Sparkles className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-ink-900">What's around · AI nearby</h3>
          <p className="text-[12.5px] text-ink-500">
            Auto-detected from OpenStreetMap · {bundle.items.length} landmarks · driving distance via OSRM · refreshed {new Date(bundle.fetchedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            {bundle.source === "cache" && " (cached)"}
          </p>
          <p className="mt-1 text-[11px] text-ink-400">
            Distances are by road. <span className="font-semibold">≈</span> means straight-line (used when routing is unavailable).
          </p>
        </div>
      </header>

      {bundle.highlights.length > 0 && (
        <div className="border-b border-ink-200/70 bg-violet-50/30 p-4">
          <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-violet-700">
            AI highlights
          </p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {bundle.highlights.map((h, i) => (
              <li key={i} className="inline-flex items-start gap-1.5 text-[13px] text-ink-800">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-violet-500" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {presentCats.map((cat) => {
          const meta = META[cat];
          const list = bundle.byCategory[cat]!;
          return (
            <div key={cat} className="rounded-2xl border border-ink-200/70 bg-white p-3.5">
              <div className="mb-2 inline-flex items-center gap-1.5">
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${meta.tone}`}>
                  {meta.icon}
                </span>
                <p className="text-[13px] font-bold text-ink-900">{meta.label}</p>
                <span className="ml-auto rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600">
                  {list.length}
                </span>
              </div>
              <ul className="space-y-1.5">
                {list.map((p) => (
                  <PoiRow key={p.id} poi={p} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PoiRow({ poi }: { poi: Poi }) {
  const isStraight = poi.distanceType === "straight";
  return (
    <li className="flex items-center justify-between gap-2 text-[12.5px]">
      <span className="min-w-0 truncate text-ink-700">{poi.name}</span>
      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${
          isStraight ? "bg-ink-100 text-ink-600" : "bg-emerald-50 text-emerald-700"
        }`}
        title={isStraight ? "Straight-line distance (driving route unavailable)" : "Driving distance via OSRM"}
      >
        {poiDistanceLabel(poi)}
      </span>
    </li>
  );
}
