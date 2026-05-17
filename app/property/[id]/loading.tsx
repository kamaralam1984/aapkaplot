import { Navbar } from "@/components/layout/Navbar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PropertyLoading() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-20" />
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <aside className="space-y-3">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </aside>
        </div>
      </main>
    </>
  );
}
