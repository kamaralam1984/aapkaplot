import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mt-4 text-[12.5px]">
      <ol className="flex flex-wrap items-center gap-1 text-ink-500">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="inline-flex items-center gap-1">
              {c.href && !last ? (
                <Link href={c.href} className="hover:text-brand-600">
                  {c.label}
                </Link>
              ) : (
                <span className={last ? "font-semibold text-ink-800" : undefined}>{c.label}</span>
              )}
              {!last && <ChevronRight className="h-3.5 w-3.5 text-ink-300" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
