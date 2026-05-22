import Link from "next/link";

const BUILDERS = [
  {
    name: "Rajan Developers",
    city: "Patna",
    projects: 12,
    sold: 45,
    badge: "DOMINATOR" as const,
    rating: 4.8,
    avatarLetter: "R",
  },
  {
    name: "Sharma Constructions",
    city: "Ranchi",
    projects: 7,
    sold: 23,
    badge: "GROWTH" as const,
    rating: 4.6,
    avatarLetter: "S",
  },
  {
    name: "Bihar Township Co.",
    city: "Gaya",
    projects: 4,
    sold: 11,
    badge: "STARTER" as const,
    rating: 4.3,
    avatarLetter: "B",
  },
];

const BADGE_STYLES: Record<string, string> = {
  DOMINATOR: "bg-amber-100 text-amber-700 ring-1 ring-amber-300",
  GROWTH: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300",
  STARTER: "bg-blue-100 text-blue-700 ring-1 ring-blue-300",
};

const AVATAR_BG: Record<string, string> = {
  DOMINATOR: "bg-amber-500",
  GROWTH: "bg-emerald-500",
  STARTER: "bg-blue-500",
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5 text-amber-400 text-sm">
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <span key={i}>★</span>;
        if (i === full && half) return <span key={i} className="opacity-60">★</span>;
        return <span key={i} className="text-zinc-300">★</span>;
      })}
      <span className="ml-1 text-zinc-600 text-xs font-medium">{rating}</span>
    </span>
  );
}

export function BuilderSpotlight() {
  return (
    <section className="py-14 px-4 bg-zinc-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">
            Featured Builders
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">
            Trusted Builders
          </h2>
          <p className="mt-2 text-zinc-500 text-sm">
            Verified developers with active projects
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BUILDERS.map((b) => (
            <div
              key={b.name}
              className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Top row: avatar + badge */}
              <div className="flex items-start justify-between">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-xl ${AVATAR_BG[b.badge]}`}
                >
                  {b.avatarLetter}
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${BADGE_STYLES[b.badge]}`}
                >
                  {b.badge}
                </span>
              </div>

              {/* Name & city */}
              <div>
                <p className="font-semibold text-zinc-900 text-[15px]">{b.name}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{b.city}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-zinc-800">{b.projects}</span> projects
                </span>
                <span className="text-zinc-300">•</span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-zinc-800">{b.sold}</span> sold
                </span>
              </div>

              {/* Rating */}
              <StarRating rating={b.rating} />

              {/* CTA */}
              <Link
                href={`/search?builder=${encodeURIComponent(b.name)}`}
                className="mt-auto inline-flex items-center justify-center rounded-lg bg-zinc-900 text-white text-xs font-semibold px-4 py-2 hover:bg-zinc-700 transition-colors"
              >
                View Properties
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
