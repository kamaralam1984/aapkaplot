import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { prisma } from "@/server/db";
import { PromoteForm } from "./PromoteForm";
import { PromotionRow } from "./PromotionRow";

export const dynamic = "force-dynamic";

const TAG_LABEL: Record<string, string> = {
  best_deal: "Best Deal",
  hot_nearby: "Hot Nearby",
  featured: "Featured",
};

const TAG_COLOR: Record<string, string> = {
  best_deal: "bg-amber-50 text-amber-700 border-amber-200",
  hot_nearby: "bg-sky-50 text-sky-700 border-sky-200",
  featured: "bg-violet-50 text-violet-700 border-violet-200",
};

function inr(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

async function getPromotions() {
  if (process.env.USE_DB !== "1") return [];
  return prisma.property.findMany({
    where: { featuredUntil: { gt: new Date() } },
    select: {
      id: true,
      title: true,
      city: true,
      priceInr: true,
      featuredUntil: true,
      promotionTag: true,
    },
    orderBy: { featuredUntil: "asc" },
  });
}

export default async function PromotionsPage() {
  const promotions = await getPromotions();

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Promotions"
        title="Best Deals & Hot Nearby"
        subtitle="Pin properties to featured slots on the homepage."
      />

      {/* Promote form */}
      <div className="surface-card p-6">
        <h2 className="text-sm font-semibold text-ink-700 mb-4">Promote a Property</h2>
        <PromoteForm />
      </div>

      {/* Active promotions table */}
      <div className="surface-card overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200/70">
          <h2 className="text-sm font-semibold text-ink-700">
            Active Promotions{" "}
            <span className="ml-1 text-xs font-normal text-ink-400">({promotions.length})</span>
          </h2>
        </div>

        {promotions.length === 0 ? (
          <p className="px-6 py-8 text-sm text-ink-400 text-center">
            No active promotions. Use the form above to promote a property.
          </p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200/70">
                <th className="px-4 py-2.5 text-left font-medium text-ink-500">Property</th>
                <th className="px-4 py-2.5 text-left font-medium text-ink-500">City</th>
                <th className="px-4 py-2.5 text-left font-medium text-ink-500">Price</th>
                <th className="px-4 py-2.5 text-left font-medium text-ink-500">Tag</th>
                <th className="px-4 py-2.5 text-left font-medium text-ink-500">Expires</th>
                <th className="px-4 py-2.5 text-right font-medium text-ink-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <PromotionRow
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  city={p.city}
                  priceInr={inr(p.priceInr)}
                  tag={p.promotionTag ?? ""}
                  tagLabel={TAG_LABEL[p.promotionTag ?? ""] ?? p.promotionTag ?? ""}
                  tagColor={TAG_COLOR[p.promotionTag ?? ""] ?? "bg-zinc-50 text-zinc-700 border-zinc-200"}
                  featuredUntil={p.featuredUntil?.toISOString() ?? ""}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
