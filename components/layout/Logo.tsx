import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="AapKaPlot home"
      className={cn("inline-flex items-center gap-2 group", className)}
    >
      <span
        className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow transition-transform group-hover:rotate-[-4deg]"
        aria-hidden
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 11.5L12 3l9 8.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"
            stroke="white"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[22px] font-bold tracking-tight">
        <span className="text-ink-900">Aap</span>
        <span className="text-gradient-brand">KaPlot</span>
      </span>
    </Link>
  );
}
