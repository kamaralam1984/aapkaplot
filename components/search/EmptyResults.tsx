import Link from "next/link";
import { SearchX, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmptyResults() {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <SearchX className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-[17px] font-bold text-ink-900">
        No properties match these filters
      </h2>
      <p className="mt-1 max-w-sm text-[13.5px] text-ink-500">
        Try widening your radius, increasing the budget or removing a few filters
        to see more results.
      </p>
      <div className="mt-5 flex gap-2">
        <Link href="/search">
          <Button variant="primary" size="md" iconLeft={<RotateCcw className="h-4 w-4" />}>
            Clear all filters
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="md">Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
