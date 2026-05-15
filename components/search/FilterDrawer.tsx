"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { FilterPanel } from "./FilterPanel";
import { Button } from "@/components/ui/Button";
import type { ParsedSearchFilters } from "@/lib/search-params";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: ParsedSearchFilters;
  total: number;
}

export function FilterDrawer({ open, onClose, filters, total }: FilterDrawerProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="ov"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            key="dr"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[90] flex max-h-[90vh] flex-col rounded-t-3xl bg-white shadow-lift lg:hidden"
            role="dialog"
            aria-modal
          >
            <div className="flex items-center justify-between border-b border-ink-200/70 px-5 py-4">
              <div className="flex items-start gap-3">
                <span aria-hidden className="h-1 w-10 self-center rounded-full bg-ink-200" />
                <div>
                  <h2 className="text-[15px] font-bold text-ink-900">Filters</h2>
                  <p className="text-[12px] text-ink-500">
                    {total.toLocaleString("en-IN")} results match
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="grid h-9 w-9 place-items-center rounded-full bg-ink-100 text-ink-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-1 py-3">
              <FilterPanel filters={filters} />
            </div>

            <div
              className="border-t border-ink-200/70 bg-white px-4 py-3"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
            >
              <Button variant="primary" size="lg" onClick={onClose} className="w-full">
                Show {total.toLocaleString("en-IN")} results
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
