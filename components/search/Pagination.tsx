"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { patchSearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const params = useSearchParams();
  const pathname = usePathname();

  if (totalPages <= 1) return null;

  const href = (n: number) => {
    const qs = patchSearchParams(params, { page: n === 1 ? null : n });
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const pages = compactPages(page, totalPages);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      <PaginationLink href={href(Math.max(1, page - 1))} disabled={page <= 1} aria-label="Previous">
        <ChevronLeft className="h-4 w-4" />
      </PaginationLink>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="grid h-9 w-9 place-items-center text-ink-400">
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <PaginationLink key={p} href={href(p)} active={p === page}>
            {p}
          </PaginationLink>
        )
      )}

      <PaginationLink href={href(Math.min(totalPages, page + 1))} disabled={page >= totalPages} aria-label="Next">
        <ChevronRight className="h-4 w-4" />
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  href,
  active,
  disabled,
  children,
  ...rest
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const baseCls = cn(
    "grid h-9 min-w-[36px] place-items-center rounded-lg border px-2 text-[13px] font-semibold transition",
    active
      ? "border-transparent bg-ink-900 text-white shadow-soft"
      : disabled
      ? "border-ink-200 bg-white text-ink-300"
      : "border-ink-200 bg-white text-ink-700 hover:border-brand-500/40"
  );
  if (disabled || active) {
    return (
      <span className={baseCls} {...rest}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={baseCls} {...rest}>
      {children}
    </Link>
  );
}

function compactPages(current: number, total: number): (number | "ellipsis")[] {
  const out: (number | "ellipsis")[] = [];
  const push = (v: number | "ellipsis") => {
    if (typeof v === "number" && (v < 1 || v > total)) return;
    if (out[out.length - 1] === v) return;
    out.push(v);
  };
  push(1);
  if (current > 3) push("ellipsis");
  for (let i = current - 1; i <= current + 1; i++) push(i);
  if (current < total - 2) push("ellipsis");
  push(total);
  return out;
}
