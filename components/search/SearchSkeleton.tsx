export function SearchSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="h-10 w-72 animate-pulse rounded-xl bg-ink-100" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filter shimmer */}
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-100" />
          ))}
        </div>
        {/* Cards shimmer */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-soft">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-100">
        <div className="absolute inset-0 animate-shimmer bg-shimmer bg-[length:200%_100%]" />
      </div>
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-ink-100" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-ink-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-ink-100" />
      </div>
    </div>
  );
}
