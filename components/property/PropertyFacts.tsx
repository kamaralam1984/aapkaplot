import {
  Bed,
  Bath,
  Maximize2,
  Car,
  Building2,
  Compass,
  Sofa,
  Clock,
  Hash,
  Calendar,
} from "lucide-react";
import type { PropertyDetail } from "@/lib/types";
import { formatArea } from "@/lib/format";

interface PropertyFactsProps {
  property: PropertyDetail;
}

export function PropertyFacts({ property }: PropertyFactsProps) {
  const { features } = property;

  const facts: { label: string; value: string; icon: React.ReactNode }[] = [];

  // Only surface area when it's actually been set on the listing. A "0 sqft"
  // tile is worse than no tile when the seller forgot to fill the field.
  if (property.areaSqft > 0) {
    facts.push({
      label: "Carpet Area",
      value: formatArea(property.areaSqft),
      icon: <Maximize2 className="h-[18px] w-[18px]" />,
    });
  }

  if (features.bedrooms != null)
    facts.push({
      label: "Bedrooms",
      value: `${features.bedrooms}`,
      icon: <Bed className="h-[18px] w-[18px]" />,
    });
  if (features.bathrooms != null)
    facts.push({
      label: "Bathrooms",
      value: `${features.bathrooms}`,
      icon: <Bath className="h-[18px] w-[18px]" />,
    });
  if (features.parking != null)
    facts.push({
      label: "Parking",
      value: `${features.parking}`,
      icon: <Car className="h-[18px] w-[18px]" />,
    });
  if (features.floor)
    facts.push({
      label: "Floor",
      value: features.floor,
      icon: <Building2 className="h-[18px] w-[18px]" />,
    });
  if (features.facing)
    facts.push({
      label: "Facing",
      value: features.facing,
      icon: <Compass className="h-[18px] w-[18px]" />,
    });
  if (features.furnishing)
    facts.push({
      label: "Furnishing",
      value: features.furnishing,
      icon: <Sofa className="h-[18px] w-[18px]" />,
    });
  if (features.ageYears != null)
    facts.push({
      label: "Age",
      value: features.ageYears === 0 ? "New" : `${features.ageYears} yr`,
      icon: <Clock className="h-[18px] w-[18px]" />,
    });
  if (features.transactionType)
    facts.push({
      label: "Transaction",
      value: features.transactionType,
      icon: <Hash className="h-[18px] w-[18px]" />,
    });
  if (features.availableFrom)
    facts.push({
      label: "Available",
      value: new Date(features.availableFrom).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      icon: <Calendar className="h-[18px] w-[18px]" />,
    });

  return (
    <section
      aria-labelledby="facts-title"
      className="surface-card mt-6 p-5 lg:p-6"
    >
      <h2 id="facts-title" className="text-[15px] font-bold text-ink-900">
        Quick Facts
      </h2>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
        {facts.map((f) => (
          <li key={f.label} className="flex items-start gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              {f.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">
                {f.label}
              </p>
              <p className="truncate text-[13.5px] font-semibold text-ink-900">
                {f.value}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
