"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Bookmark } from "lucide-react";
import type { ParsedSearchFilters } from "@/lib/search-params";
import { patchSearchParams } from "@/lib/search-params";
import { useSearchParams, usePathname } from "next/navigation";
import { SortMenu } from "./SortMenu";
import { ViewToggle } from "./ViewToggle";
import { LocationAutocomplete } from "./LocationAutocomplete";
import { Button } from "@/components/ui/Button";

interface SearchToolbarProps {
  filters: ParsedSearchFilters;
  total: number;
  onOpenFilters: () => void;
}

export function SearchToolbar({ filters, total, onOpenFilters }: SearchToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [draft, setDraft] = useState(filters.q ?? "");
  const [pending, startTransition] = useTransition();

  const submit = (next: string) => {
    const qs = patchSearchParams(params, { q: next || null });
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  return (
    <div className="sticky top-16 z-30 border-b border-ink-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <div className="flex-1">
          <LocationAutocomplete
            value={draft}
            onChange={setDraft}
            onSubmit={submit}
            placeholder="Search city, locality or property"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 text-[13px] font-semibold text-ink-800 shadow-soft transition hover:border-brand-500/40 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>

          <p className="hidden text-[12.5px] text-ink-500 sm:block">
            <span className="font-semibold text-ink-900">{total.toLocaleString("en-IN")}</span> results
            {pending && <span className="ml-1 text-brand-500">· updating…</span>}
          </p>

          <SortMenu value={filters.sort} />
          <ViewToggle value={filters.view} />

          <Button variant="outline" size="sm" iconLeft={<Bookmark className="h-4 w-4" />}>
            <span className="hidden md:inline">Save search</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
