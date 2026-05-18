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
      {/* Horizontal scroll instead of wrap: long locality names (e.g.
          "Naya Tola/Phulwari Sharif") can't push the page past the
          viewport, and the trail stays on one tidy line on phones. */}
      <ol className="no-scrollbar flex items-center gap-1 overflow-x-auto whitespace-nowrap text-ink-500">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="inline-flex shrink-0 items-center gap-1">
              {c.href && !last ? (
                <Link href={c.href} className="hover:text-brand-600">
                  {c.label}
                </Link>
              ) : (
                <span className={last ? "font-semibold text-ink-800" : undefined}>{c.label}</span>
              )}
              {!last && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-300" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
