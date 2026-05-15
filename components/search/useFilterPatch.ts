"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { patchSearchParams } from "@/lib/search-params";

/** Hook: returns a function that updates URL filters without leaving the page. */
export function useFilterPatch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return useCallback(
    (patch: Record<string, string | number | boolean | string[] | null | undefined>) => {
      const qs = patchSearchParams(params, patch);
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, params, pathname]
  );
}
