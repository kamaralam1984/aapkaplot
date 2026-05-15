"use client";

import { useState } from "react";
import type { Property } from "@/lib/types";
import type { ParsedSearchFilters } from "@/lib/search-params";
import { SearchToolbar } from "./SearchToolbar";
import { FilterPanel } from "./FilterPanel";
import { FilterDrawer } from "./FilterDrawer";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { ResultsPanel } from "./ResultsPanel";
import { Pagination } from "./Pagination";

interface SearchPageClientProps {
  filters: ParsedSearchFilters;
  items: (Property & { distanceKm: number })[];
  origin: { lat: number; lng: number };
  total: number;
  page: number;
  totalPages: number;
}

export function SearchPageClient({
  filters,
  items,
  origin,
  total,
  page,
  totalPages,
}: SearchPageClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <SearchToolbar
        filters={filters}
        total={total}
        onOpenFilters={() => setDrawerOpen(true)}
      />

      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
        <ActiveFilterChips filters={filters} />

        <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
          {/* Sidebar filters — desktop only */}
          <aside className="hidden lg:sticky lg:top-[136px] lg:block lg:h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-1">
            <FilterPanel filters={filters} />
          </aside>

          <div className="min-w-0">
            <ResultsPanel items={items} origin={origin} view={filters.view} />
            <Pagination page={page} totalPages={totalPages} />
          </div>
        </div>
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        total={total}
      />
    </>
  );
}
