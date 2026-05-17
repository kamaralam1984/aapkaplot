import Link from "next/link";
import { Plus, Inbox, FileText } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/server/db";
import { getSession } from "@/lib/auth-server";
import { SellerListingsTable, type SellerListingRow } from "@/components/seller/SellerListingsTable";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const session = await getSession();
  if (process.env.USE_DB !== "1" || !session) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="0 listings"
          title="Your listings"
          subtitle={session ? "Database is off — listings unavailable." : "Sign in to view your listings."}
          actions={
            <Link href="/sell/new">
              <Button variant="primary" size="md" iconLeft={<Plus className="h-4 w-4" />}>
                New listing
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const rows = await prisma.property.findMany({
    where: { ownerId: session.uid },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, coverUrl: true,
      kind: true, intent: true, status: true,
      priceInr: true, areaSqft: true,
      locality: true, city: true,
      verified: true, createdAt: true,
    },
  });

  const leadCounts = rows.length
    ? await prisma.lead.groupBy({
        by: ["propertyId"],
        where: { propertyId: { in: rows.map((r) => r.id) } },
        _count: { _all: true },
      })
    : [];
  const leadMap = new Map(leadCounts.map((l) => [l.propertyId, l._count._all]));

  const listings: SellerListingRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    coverUrl: r.coverUrl,
    status: r.status,
    priceInr: r.priceInr,
    areaSqft: r.areaSqft,
    locality: r.locality,
    city: r.city,
    leadsCount: leadMap.get(r.id) ?? 0,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={`${listings.length} listing${listings.length === 1 ? "" : "s"}`}
        title="Your listings"
        subtitle="Edit, pause, boost or remove your properties anytime."
        actions={
          <Link href="/sell/new">
            <Button variant="primary" size="md" iconLeft={<Plus className="h-4 w-4" />}>
              New listing
            </Button>
          </Link>
        }
      />

      {listings.length === 0 ? (
        <div className="surface-card grid place-items-center gap-3 px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <FileText className="h-6 w-6" />
          </span>
          <p className="text-[15px] font-bold text-ink-900">No listings yet</p>
          <p className="max-w-sm text-[13px] text-ink-500">
            Post your first property to start receiving leads. Takes about 3 minutes.
          </p>
          <Link href="/sell/new" className="mt-2">
            <Button variant="primary" size="md" iconLeft={<Plus className="h-4 w-4" />}>
              Post your first listing
            </Button>
          </Link>
        </div>
      ) : (
        <SellerListingsTable rows={listings} />
      )}

      <div className="surface-card flex items-center gap-3 px-5 py-3 text-[12.5px] text-ink-500">
        <Inbox className="h-4 w-4 text-ink-400" />
        <span>
          Leads are updated in real-time. Click <strong>Leads</strong> in the sidebar to chat with buyers.
        </span>
      </div>
    </div>
  );
}
