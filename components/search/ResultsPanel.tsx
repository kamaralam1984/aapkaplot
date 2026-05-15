"use client";

import { useState } from "react";
import type { Property } from "@/lib/types";
import type { ViewMode } from "@/lib/search-params";
import { ResultsGrid } from "./ResultsGrid";
import { ResultsMap } from "./ResultsMap";
import { EmptyResults } from "./EmptyResults";

interface ResultsPanelProps {
  items: (Property & { distanceKm: number })[];
  origin: { lat: number; lng: number };
  view: ViewMode;
}

export function ResultsPanel({ items, origin, view }: ResultsPanelProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  if (items.length === 0) {
    return <EmptyResults />;
  }

  if (view === "map") {
    return (
      <div className="h-[calc(100vh-200px)] min-h-[520px]">
        <ResultsMap
          items={items}
          origin={origin}
          highlightId={hoverId}
          onHover={setHoverId}
          className="h-full"
        />
      </div>
    );
  }

  if (view === "list") {
    return <ResultsGrid items={items} variant="wide" highlightId={hoverId} onHover={setHoverId} />;
  }

  // split
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(420px,40%)]">
      <ResultsGrid items={items} variant="split" highlightId={hoverId} onHover={setHoverId} />
      <div className="sticky top-[140px] hidden h-[calc(100vh-160px)] lg:block">
        <ResultsMap
          items={items}
          origin={origin}
          highlightId={hoverId}
          onHover={setHoverId}
          className="h-full"
        />
      </div>
    </div>
  );
}
