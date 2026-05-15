import { Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { PropertyCard } from "@/components/property/PropertyCard";
import { MOCK_PROPERTIES, DEFAULT_ORIGIN } from "@/lib/mock-data";
import { rankRecommendations } from "@/ai/recommend";

export default function RecommendationsPage() {
  const picks = rankRecommendations({
    origin: DEFAULT_ORIGIN,
    pool: MOCK_PROPERTIES,
    limit: 12,
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> AI Powered
          </span>
        }
        title="Hand-picked just for you"
        subtitle="Ranked by proximity, trust, freshness, and price competitiveness in your area."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {picks.map((p) => (
          <PropertyCard key={p.id} property={p} showAIBadge />
        ))}
      </div>
    </div>
  );
}
