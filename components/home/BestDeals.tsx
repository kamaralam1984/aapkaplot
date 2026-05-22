import Link from "next/link";
import { prisma } from "@/server/db";

type DealProperty = {
  id: string;
  title: string;
  city: string;
  locality: string;
  priceInr: number;
  coverUrl: string;
  gallery: string[];
};

const MOCK_BEST_DEALS: DealProperty[] = [
  {
    id: "mock-bd-1",
    title: "Premium Plot in Boring Road",
    city: "Patna",
    locality: "Boring Road",
    priceInr: 4500000,
    coverUrl: "",
    gallery: [],
  },
  {
    id: "mock-bd-2",
    title: "Affordable 2BHK Flat",
    city: "Ranchi",
    locality: "Kanke",
    priceInr: 2800000,
    coverUrl: "",
    gallery: [],
  },
  {
    id: "mock-bd-3",
    title: "Corner Plot with Road Access",
    city: "Patna",
    locality: "Kankarbagh",
    priceInr: 3200000,
    coverUrl: "",
    gallery: [],
  },
];

async function fetchBestDeals(): Promise<DealProperty[]> {
  if (process.env.USE_DB !== "1") return MOCK_BEST_DEALS;
  try {
    return await prisma.property.findMany({
      where: {
        status: "ACTIVE",
        promotionTag: "best_deal",
        featuredUntil: { gt: new Date() },
      },
      take: 6,
      select: {
        id: true,
        title: true,
        city: true,
        locality: true,
        priceInr: true,
        coverUrl: true,
        gallery: true,
      },
    });
  } catch {
    return MOCK_BEST_DEALS;
  }
}

function inr(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export async function BestDeals() {
  const deals = await fetchBestDeals();
  if (deals.length === 0) return null;

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🔥</span>
        <div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Limited Time</p>
          <h2 className="text-xl font-bold text-ink-900">Best Deals</h2>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {deals.map((p) => {
          const thumb = p.coverUrl || p.gallery?.[0] || "";
          return (
            <Link
              key={p.id}
              href={`/property/${p.id}`}
              className="flex-none w-64 snap-start rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-36 bg-zinc-100">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300 text-4xl">🏠</div>
                )}
                <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  🔥 Best Deal
                </span>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-semibold text-ink-800 line-clamp-2 leading-snug">{p.title}</p>
                <p className="text-xs text-ink-400 mt-0.5">
                  {p.locality ? `${p.locality}, ` : ""}{p.city}
                </p>
                <p className="text-base font-bold text-violet-700 mt-2">{inr(p.priceInr)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
