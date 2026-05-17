import { Sparkles, Cpu } from "lucide-react";
import { fetchPropertyPois } from "@/lib/property-poi";
import { generateNeighbourhoodNarrative } from "@/lib/poi-narrative";

interface PropertyNeighbourhoodNarrativeProps {
  lat: number;
  lng: number;
  kind?: string;
  bhk?: number;
  locality?: string;
  city?: string;
  intent?: "buy" | "rent" | "sell";
}

/**
 * Auto-generated "Why you'll love this neighbourhood" paragraph.
 * Pure-JS rule-based by default; optionally smoothed via Cloudflare Workers
 * AI (free pool, no key required for default model). No OpenAI.
 *
 * Renders nothing when there are no nearby POIs (Overpass returned empty).
 */
export async function PropertyNeighbourhoodNarrative(props: PropertyNeighbourhoodNarrativeProps) {
  const bundle = await fetchPropertyPois(props.lat, props.lng).catch(() => null);
  if (!bundle || bundle.items.length === 0) return null;

  const narrative = await generateNeighbourhoodNarrative(bundle, {
    kind: props.kind,
    bhk: props.bhk,
    locality: props.locality,
    city: props.city,
    intent: props.intent,
  });
  if (!narrative.text) return null;

  const sourceLabel =
    narrative.source === "cloudflare-ai"
      ? "Polished by Cloudflare Workers AI (free)"
      : "Generated from OpenStreetMap landmarks";

  return (
    <section className="surface-card overflow-hidden border-violet-200/60 bg-gradient-to-br from-violet-50/60 via-white to-white">
      <header className="flex items-start gap-3 border-b border-violet-200/60 bg-white/50 p-4 backdrop-blur">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
          <Sparkles className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-ink-900">
            Why you'll love this neighbourhood
          </h3>
          <p className="inline-flex items-center gap-1 text-[12px] text-ink-500">
            <Cpu className="h-3 w-3 text-violet-500" /> {sourceLabel}
          </p>
        </div>
      </header>

      <div className="space-y-3 p-5 text-[14px] leading-relaxed text-ink-800">
        {narrative.text
          .split(/\n\n+/)
          .filter(Boolean)
          .map((para, i) => (
            <p key={i}>{para}</p>
          ))}
      </div>

      <footer className="border-t border-violet-200/60 bg-white/40 px-5 py-2.5 text-[11px] text-ink-500">
        Generated automatically from open data — no paid AI. Refresh the page if you've edited
        the listing's location.
      </footer>
    </section>
  );
}
