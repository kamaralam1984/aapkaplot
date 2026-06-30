import {
  Sparkles, Train, TrainFront, Plane, Hospital, School, GraduationCap,
  ShoppingBag, ShoppingCart, Utensils, Banknote, CreditCard, Shield,
  Fuel, Trees, Landmark, Building2, Bus, Star, Store, MapPinned, Dumbbell, Waves, MapPin,
} from "lucide-react";
import { fetchPropertyPois, type PoiCategory, type Poi, CATEGORY_ORDER, poiDistanceLabel } from "@/lib/property-poi";
import { NearbyCustomEditor } from "./NearbyCustomEditor";

interface CustomEntry {
  id: string;
  name: string;
  category: PoiCategory;
  distanceKm: number;
}

interface PropertyAINearbyProps {
  lat: number;
  lng: number;
  propertyId?: string;
  nearbyCustom?: CustomEntry[];
  canEdit?: boolean;
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
  bus_stop:     { label: "Bus stops",       icon: <Bus className="h-4 w-4" />,          tone: "bg-sky-50 text-sky-700" },
  place_of_worship: { label: "Temples / Mosque / Church", icon: <Star className="h-4 w-4" />, tone: "bg-orange-50 text-orange-700" },
  market:       { label: "Markets / Bazaar", icon: <Store className="h-4 w-4" />,       tone: "bg-amber-50 text-amber-700" },
  water_park:   { label: "Water / Amusement Parks", icon: <Waves className="h-4 w-4" />, tone: "bg-cyan-50 text-cyan-700" },
  gym:          { label: "Gyms / Fitness",   icon: <Dumbbell className="h-4 w-4" />,    tone: "bg-purple-50 text-purple-700" },
  other:        { label: "Other",            icon: <MapPin className="h-4 w-4" />,       tone: "bg-ink-100 text-ink-700" },
};

/** Convert custom entries to display Poi objects (marked with isCustom). */
function toCustomPois(entries: CustomEntry[]): (Poi & { isCustom: true })[] {
  return entries.map((e) => ({
    id: `custom-${e.id}`,
    name: e.name,
    category: e.category,
    lat: 0,
    lng: 0,
    distanceKm: e.distanceKm,
    distanceType: "road" as const,
    isCustom: true as const,
  }));
}

export async function PropertyAINearby({ lat, lng, propertyId, nearbyCustom, canEdit }: PropertyAINearbyProps) {
  console.log("[PropertyAINearby]", { canEdit, propertyId });
  const bundle = await fetchPropertyPois(lat, lng).catch(() => null);

  const customPois = toCustomPois(nearbyCustom ?? []);

  // Merge custom entries into byCategory (custom first, then OSM)
  function buildMergedByCategory(osmByCategory: Record<string, (Poi & { isCustom?: boolean })[]>) {
    const merged: Record<string, (Poi & { isCustom?: boolean })[]> = { ...osmByCategory };
    for (const cp of customPois) {
      if (!merged[cp.category]) merged[cp.category] = [];
      // Prepend custom entries so they appear at top of their category
      merged[cp.category] = [cp, ...merged[cp.category]];
    }
    return merged;
  }

  // Categories that have data (OSM + custom)
  function getPresentCats(byCategory: Record<string, unknown[]>) {
    return CATEGORY_ORDER.filter((c) => byCategory[c]?.length);
  }

  if (!bundle || bundle.items.length === 0) {
    // No OSM data — still show custom entries if any
    const customByCategory = buildMergedByCategory({});
    const customCats = getPresentCats(customByCategory);

    return (
      <section className="surface-card overflow-hidden">
        <header className="flex items-start gap-3 border-b border-ink-200/70 bg-white/60 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {canEdit && propertyId && (
                <NearbyCustomEditor propertyId={propertyId} initial={nearbyCustom ?? []} />
              )}
              <h3 className="text-[15px] font-bold text-ink-900">What's around</h3>
            </div>
            <p className="text-[12.5px] text-ink-500">
              {customCats.length > 0
                ? "OpenStreetMap data unavailable — showing manually added places only."
                : "We couldn't pull OpenStreetMap data for this location right now. Try refreshing in a minute."}
            </p>
          </div>
        </header>
        {customCats.length > 0 && (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {customCats.map((cat) => (
              <CategoryCard key={cat} cat={cat} list={customByCategory[cat]!} />
            ))}
          </div>
        )}
      </section>
    );
  }

  const mergedByCategory = buildMergedByCategory(bundle.byCategory as Record<string, Poi[]>);
  const presentCats = getPresentCats(mergedByCategory);

  return (
    <section className="surface-card overflow-hidden">
      <header className="flex items-start gap-3 border-b border-ink-200/70 bg-white/60 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
          <Sparkles className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && propertyId && (
              <NearbyCustomEditor propertyId={propertyId} initial={nearbyCustom ?? []} />
            )}
            <h3 className="text-[15px] font-bold text-ink-900">What's around · AI nearby</h3>
          </div>
          <p className="text-[12.5px] text-ink-500">
            Auto-detected from OpenStreetMap · {bundle.items.length} landmarks · driving distance via OSRM · refreshed {new Date(bundle.fetchedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            {bundle.source === "cache" && " (cached)"}
            {customPois.length > 0 && ` · ${customPois.length} manually added`}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-500">
            <span>
              Distances from{" "}
              <span className="font-mono font-semibold text-ink-700">
                {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
              </span>
            </span>
            <a
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-violet-700 underline-offset-2 hover:underline"
            >
              View on map ↗
            </a>
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-violet-700 underline-offset-2 hover:underline"
            >
              Google Maps ↗
            </a>
          </div>
          <p className="mt-1 text-[11px] text-ink-400">
            By road via OSRM. <span className="font-semibold">≈</span> means straight-line fallback.
            {customPois.length > 0 && " · "}
            {customPois.length > 0 && <span className="inline-flex items-center gap-0.5"><MapPinned className="inline h-3 w-3" /> = manually added by owner.</span>}
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
        {presentCats.map((cat) => (
          <CategoryCard key={cat} cat={cat} list={mergedByCategory[cat]!} />
        ))}
      </div>
    </section>
  );
}

function CategoryCard({ cat, list }: { cat: PoiCategory; list: (Poi & { isCustom?: boolean })[] }) {
  const meta = META[cat];
  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-3.5">
      <div className="mb-2 flex items-center gap-1.5">
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
}

function PoiRow({ poi }: { poi: Poi & { isCustom?: boolean } }) {
  const isStraight = poi.distanceType === "straight";
  return (
    <li className="flex items-center justify-between gap-2 text-[12.5px]">
      <span className="flex min-w-0 items-center gap-1 truncate text-ink-700">
        {poi.isCustom && <MapPinned className="h-3 w-3 shrink-0 text-violet-500" aria-label="Manually added by owner" />}
        <span className="truncate">{poi.name}</span>
      </span>
      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${
          poi.isCustom ? "bg-violet-50 text-violet-700" : isStraight ? "bg-ink-100 text-ink-600" : "bg-emerald-50 text-emerald-700"
        }`}
        title={poi.isCustom ? "Manually added distance" : isStraight ? "Straight-line (driving route unavailable)" : "Driving distance via OSRM"}
      >
        {poiDistanceLabel(poi)}
      </span>
    </li>
  );
}
