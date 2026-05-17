import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Building2, MapPin, CalendarCheck, ArrowRight, Hash } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { listProjectsByCity, MOCK_PROJECTS, type MockProject } from "@/lib/mock-projects";
import { prisma } from "@/server/db";

interface PageProps {
  params: Promise<{ city: string }>;
}

function prettify(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const name = prettify(decodeURIComponent(city));
  return {
    title: `New launches & ongoing projects in ${name}`,
    description: `Discover upcoming and ongoing housing projects in ${name}. Compare amenities, RERA, possession dates and pricing.`,
    alternates: { canonical: `/in/${city}/projects` },
  };
}

async function loadProjects(city: string): Promise<MockProject[]> {
  if (process.env.USE_DB === "1") {
    try {
      const rows = await prisma.project.findMany({
        where: { city: { equals: city, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
        take: 24,
      });
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          builder: r.builder,
          description: r.description ?? "",
          city: r.city,
          locality: r.locality,
          state: r.state,
          lat: r.lat,
          lng: r.lng,
          status: r.status as MockProject["status"],
          startDate: r.startDate?.toISOString(),
          possessionDate: r.possessionDate?.toISOString(),
          totalUnits: r.totalUnits ?? undefined,
          reraId: r.reraId ?? undefined,
          amenities: r.amenities,
          coverUrl: r.coverUrl,
          gallery: r.gallery,
        }));
      }
    } catch (err) {
      console.error("[projects] db_read_failed", err);
    }
  }
  return listProjectsByCity(prettify(city));
}

export default async function CityProjectsPage({ params }: PageProps) {
  const { city } = await params;
  const cityName = prettify(decodeURIComponent(city));
  const projects = await loadProjects(decodeURIComponent(city));
  const list = projects.length > 0 ? projects : MOCK_PROJECTS;

  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-hero-radial">
          <Container size="wide" className="relative py-12 lg:py-16">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
              <Building2 className="h-3.5 w-3.5" /> Projects
            </p>
            <h1 className="mt-4 text-display-lg font-display text-ink-900">
              New launches in <span className="text-gradient-brand">{cityName}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-ink-600">
              {projects.length > 0
                ? `${projects.length} ongoing / upcoming project${projects.length === 1 ? "" : "s"} from verified builders.`
                : `Sample listings shown — projects from real builders in ${cityName} will appear once they list.`}
            </p>
          </Container>
        </section>

        <Container size="wide" className="py-10">
          <ul className="grid gap-5 lg:grid-cols-2">
            {list.map((p) => (
              <li key={p.id} className="surface-card overflow-hidden">
                <Link href={`/in/${city}/projects/${p.slug}`} className="block">
                  <div className="relative aspect-[16/9] bg-ink-100">
                    <Image src={p.coverUrl} alt={p.name} fill sizes="(min-width:1024px) 560px, 100vw" className="object-cover" />
                    <span
                      className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${
                        p.status === "ongoing"
                          ? "bg-emerald-500 text-white"
                          : p.status === "upcoming"
                          ? "bg-sky-500 text-white"
                          : "bg-ink-700 text-white"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="p-5">
                    <h2 className="text-[16px] font-bold text-ink-900">{p.name}</h2>
                    <p className="text-[12.5px] font-semibold text-brand-600">{p.builder}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] text-ink-500">
                      <MapPin className="h-3 w-3 text-brand-500" />
                      {p.locality}, {p.city}
                    </p>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-600">
                      {p.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-ink-500">
                      {p.possessionDate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5">
                          <CalendarCheck className="h-3 w-3" />
                          Possession {new Date(p.possessionDate).getFullYear()}
                        </span>
                      )}
                      {p.totalUnits != null && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5">
                          {p.totalUnits} units
                        </span>
                      )}
                      {p.reraId && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5">
                          <Hash className="h-3 w-3" />
                          {p.reraId}
                        </span>
                      )}
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700">
                      View project <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </main>
      <Footer />
    </>
  );
}
