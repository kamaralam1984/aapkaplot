import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SearchPageClient } from "@/components/search/SearchPageClient";
import { parseSearchParams } from "@/lib/search-params";
import { runSearch } from "@/lib/search";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const filters = parseSearchParams(sp);
  const parts: string[] = [];
  if (filters.kind) parts.push(filters.kind.charAt(0).toUpperCase() + filters.kind.slice(1) + "s");
  else parts.push("Properties");
  if (filters.intent) parts.push(`for ${filters.intent}`);
  if (filters.q) parts.push(`in ${filters.q}`);
  if (filters.bhk) parts.push(`· ${filters.bhk} BHK`);

  const title = parts.join(" ");
  const description = `Discover ${title.toLowerCase()} on AapKaPlot with live maps, satellite view, verified owners and AI recommendations.`;
  return {
    title,
    description,
    alternates: { canonical: "/search" },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = parseSearchParams(sp);
  const { items, total, page, totalPages, origin } = runSearch(filters);

  return (
    <>
      <Navbar />
      <main className="pb-20">
        <SearchPageClient
          filters={filters}
          items={items}
          origin={origin}
          total={total}
          page={page}
          totalPages={totalPages}
        />
      </main>
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SearchResultsPage",
            url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://aapkaplot.com"}/search`,
            name: "Property search results",
            numberOfItems: total,
          }),
        }}
      />
    </>
  );
}
