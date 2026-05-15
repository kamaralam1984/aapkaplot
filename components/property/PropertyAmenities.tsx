import {
  Car, Zap, Droplets, Building, Dumbbell, Waves, Trees, Shield,
  CameraIcon, Baby, Coffee, Wifi, Snowflake, Sofa, Cat,
} from "lucide-react";
import type { AmenityId } from "@/lib/types";
import { AMENITIES_CATALOG } from "@/lib/property-detail";

interface PropertyAmenitiesProps {
  amenities: AmenityId[];
}

const ICONS: Record<AmenityId, React.ReactNode> = {
  parking:        <Car className="h-[18px] w-[18px]" />,
  "power-backup": <Zap className="h-[18px] w-[18px]" />,
  "water-supply": <Droplets className="h-[18px] w-[18px]" />,
  lift:           <Building className="h-[18px] w-[18px]" />,
  gym:            <Dumbbell className="h-[18px] w-[18px]" />,
  pool:           <Waves className="h-[18px] w-[18px]" />,
  garden:         <Trees className="h-[18px] w-[18px]" />,
  security:       <Shield className="h-[18px] w-[18px]" />,
  cctv:           <CameraIcon className="h-[18px] w-[18px]" />,
  playground:     <Baby className="h-[18px] w-[18px]" />,
  clubhouse:      <Coffee className="h-[18px] w-[18px]" />,
  wifi:           <Wifi className="h-[18px] w-[18px]" />,
  ac:             <Snowflake className="h-[18px] w-[18px]" />,
  furnished:      <Sofa className="h-[18px] w-[18px]" />,
  "pet-friendly": <Cat className="h-[18px] w-[18px]" />,
};

export function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
  if (!amenities.length) return null;

  return (
    <section className="surface-card mt-6 p-5 lg:p-6" aria-labelledby="amenities-title">
      <h2 id="amenities-title" className="text-[15px] font-bold text-ink-900">
        Amenities &amp; Features
      </h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {amenities.map((id) => (
          <li
            key={id}
            className="flex items-center gap-2.5 rounded-xl border border-ink-200/70 bg-white px-3 py-2.5 transition hover:border-brand-500/40 hover:bg-brand-50/40"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
              {ICONS[id]}
            </span>
            <span className="text-[13px] font-medium text-ink-800">
              {AMENITIES_CATALOG[id].label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
