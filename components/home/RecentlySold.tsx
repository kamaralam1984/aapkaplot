const SOLD_PROPERTIES = [
  { title: "2 BHK Flat, Boring Road", city: "Patna", soldFor: "₹45L", daysAgo: 2 },
  { title: "Plot 1200 sqft, Kanke Road", city: "Ranchi", soldFor: "₹18L", daysAgo: 5 },
  { title: "House 3BHK, Rajendra Nagar", city: "Patna", soldFor: "₹72L", daysAgo: 7 },
  { title: "Shop 400 sqft, Main Road", city: "Dhanbad", soldFor: "₹28L", daysAgo: 9 },
];

export function RecentlySold() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-500 mb-1">
            Market Activity
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">
            Recently Sold Properties
          </h2>
        </div>

        {/* Horizontal scroll rail */}
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-zinc-200">
          {SOLD_PROPERTIES.map((p) => (
            <div
              key={p.title}
              className="min-w-[220px] sm:min-w-[260px] flex-shrink-0 snap-start bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* SOLD badge */}
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-full mb-3">
                SOLD
              </span>

              {/* Title */}
              <p className="text-[13px] font-semibold text-zinc-900 leading-snug mb-1">
                {p.title}
              </p>

              {/* City */}
              <p className="text-xs text-zinc-500 mb-3">{p.city}</p>

              {/* Price + days */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-600">{p.soldFor}</span>
                <span className="text-xs text-zinc-400">{p.daysAgo}d ago</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
