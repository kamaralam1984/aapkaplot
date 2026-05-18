import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Search } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { DashboardEmpty } from "@/components/dashboard/DashboardEmpty";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Button } from "@/components/ui/Button";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { getProperty } from "@/lib/data/properties";
import type { Property } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/me/saved");

  let saved: Awaited<ReturnType<typeof loadFavoriteProperties>> = [];
  if (process.env.USE_DB === "1") {
    saved = await loadFavoriteProperties(session.uid);
  }

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

/**
 * Pull the user's Favorite rows + the linked Property rows in one round trip.
 * Falls back to MOCK_PROPERTIES when a favorite points at a mock id that
 * existed before USE_DB=1 was turned on (a few demo accounts hit this).
 */
async function loadFavoriteProperties(uid: string): Promise<Property[]> {
  const favs = await prisma.favorite.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    select: { propertyId: true },
  });
  const ids = favs.map((f) => f.propertyId);
  if (ids.length === 0) return [];

  // Resolve each id: real DB first, fall back to MOCK_PROPERTIES for legacy
  // demo ids (some accounts had favourites set before USE_DB was flipped on).
  const fetched = await Promise.all(
    ids.map(async (id) => {
      const real = await getProperty(id).catch(() => null);
      if (real) return real;
      return MOCK_PROPERTIES.find((p) => p.id === id) ?? null;
    }),
  );
  return fetched.filter((p): p is Property => !!p);
}
