"use client";

import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { DashboardEmpty } from "@/components/dashboard/DashboardEmpty";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Button } from "@/components/ui/Button";
import { useFavorites } from "@/lib/use-favorites";
import { MOCK_PROPERTIES } from "@/lib/mock-data";

export default function SavedPage() {
  const { ids } = useFavorites();
  const saved = MOCK_PROPERTIES.filter((p) => ids.includes(p.id));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Your collection"
        title={`Saved properties · ${saved.length}`}
        subtitle="Tap the heart on any listing to add it here. We'll alert you if the price drops."
        actions={
          <Link href="/search">
            <Button variant="outline" size="md" iconLeft={<Search className="h-4 w-4" />}>
              Find more
            </Button>
          </Link>
        }
      />

      {saved.length === 0 ? (
        <DashboardEmpty
          icon={Heart}
          title="No saved properties yet"
          body="As you browse listings, tap the ♥ on any card to save it here for later comparison."
          action={
            <Link href="/search">
              <Button variant="primary" size="md" iconLeft={<Search className="h-4 w-4" />}>
                Browse properties
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {saved.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
