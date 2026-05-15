import { Navbar } from "@/components/layout/Navbar";
import { SearchSkeleton } from "@/components/search/SearchSkeleton";

export default function Loading() {
  return (
    <>
      <Navbar />
      <main>
        <div className="sticky top-16 z-30 border-b border-ink-200/70 bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="h-11 flex-1 animate-pulse rounded-xl bg-ink-100" />
            <div className="h-10 w-24 animate-pulse rounded-xl bg-ink-100" />
          </div>
        </div>
        <SearchSkeleton />
      </main>
    </>
  );
}
