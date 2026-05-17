import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin, CalendarCheck, Hash, Building2, ShieldCheck, ArrowLeft,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { findProjectBySlug, type MockProject } from "@/lib/mock-projects";
import { prisma } from "@/server/db";
import { fetchLocalityInsight } from "@/lib/overpass";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ city: string; slug: string }>;
}

async function loadProject(slug: string): Promise<MockProject | null> {
  if (process.env.USE_DB === "1") {
    try {
      const r = await prisma.project.findUnique({ where: { slug } });
      if (r) {
        return {
          id: r.id, slug: r.slug, name: r.name, builder: r.builder,
          description: r.description ?? "",
          city: r.city, locality: r.locality, state: r.state,
          lat: r.lat, lng: r.lng,
          status: r.status as MockProject["status"],
          startDate: r.startDate?.toISOString(),
          possessionDate: r.possessionDate?.toISOString(),
          totalUnits: r.totalUnits ?? undefined,
          reraId: r.reraId ?? undefined,
          amenities: r.amenities,
          coverUrl: r.coverUrl,
          gallery: r.gallery,
        };
      }
    } catch (err) {
      console.error("[project/detail] db_read_failed", err);
    }
  }
  return findProjectBySlug(slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const p = await loadProject(slug);
  if (!p) return { title: "Project not found" };
  return {
    title: `${p.name} by ${p.builder} — ${p.locality}, ${p.city}`,
    description: p.description,
    openGraph: {
      title: `${p.name} · ${p.locality}, ${p.city}`,
      description: p.description,
      images: p.coverUrl ? [{ url: p.coverUrl, width: 1600, height: 900 }] : undefined,
    },
    alternates: { canonical: `/in/${p.city.toLowerCase()}/projects/${p.slug}` },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { city, slug } = await params;
  const project = await loadProject(slug);
  if (!project) notFound();

  const insight = await fetchLocalityInsight(
    project.city, project.locality, project.lat, project.lng
  ).catch(() => null);

  const a = insight?.amenities ?? {
    schools: 0, hospitals: 0, metro: 0, banks: 0, malls: 0, restaurants: 0,
  };

  return (
    <>
      <Navbar />
      <main className="pb-16">
        <Container size="wide" className="pt-6">
          <Link
            href={`/in/${city}/projects`}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 hover:text-ink-800"
          >
            <ArrowLeft className="h-4 w-4" /> All projects in {project.city}
          </Link>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/70 bg-brand-50 px-3 py-1 text-[12px] font-semibold text-brand-700">
                <Building2 className="h-3.5 w-3.5" /> {project.builder}
              </p>
              <h1 className="mt-3 text-display-lg font-display text-ink-900">{project.name}</h1>
              <p className="mt-1 inline-flex items-center gap-1 text-[14px] text-ink-500">
                <MapPin className="h-3.5 w-3.5 text-brand-500" />
                {project.locality}, {project.city}, {project.state}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/search?q=${encodeURIComponent(project.name)}`}>
                <Button variant="primary" size="md">Enquire</Button>
              </Link>
            </div>
          </div>

          <div className="relative mt-6 aspect-[16/8] overflow-hidden rounded-2xl bg-ink-100">
            <Image
              src={project.coverUrl}
              alt={project.name}
              fill
              sizes="(min-width:1024px) 1100px, 100vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Key facts */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Status" value={project.status} icon={<ShieldCheck className="h-4 w-4" />} />
            <Fact
              label="Possession"
              value={project.possessionDate ? new Date(project.possessionDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
              icon={<CalendarCheck className="h-4 w-4" />}
            />
            <Fact label="Total units" value={project.totalUnits ?? "—"} icon={<Building2 className="h-4 w-4" />} />
            <Fact label="RERA" value={project.reraId ?? "—"} icon={<Hash className="h-4 w-4" />} />
          </section>

          {/* About */}
          {project.description && (
            <section className="surface-card mt-6 p-6">
              <h2 className="text-[15px] font-bold text-ink-900">About this project</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-700">{project.description}</p>
            </section>
          )}

          {/* Amenities */}
          {project.amenities.length > 0 && (
            <section className="surface-card mt-6 p-6">
              <h2 className="text-[15px] font-bold text-ink-900">Project amenities</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {project.amenities.map((a) => (
                  <li
                    key={a}
                    className="rounded-full border border-ink-200 bg-white px-3 py-1 text-[12.5px] font-semibold text-ink-700"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Locality snapshot */}
          <section className="surface-card mt-6 p-6">
            <h2 className="text-[15px] font-bold text-ink-900">Neighbourhood (within 2 km)</h2>
            <p className="text-[12.5px] text-ink-500">
              Live OpenStreetMap data
              {insight?.source === "cache" ? " (cached)" : ""}.
            </p>
            <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
              <Mini label="Schools" value={a.schools} />
              <Mini label="Hospitals" value={a.hospitals} />
              <Mini label="Metro" value={a.metro} />
              <Mini label="Banks" value={a.banks} />
              <Mini label="Malls" value={a.malls} />
              <Mini label="Restaurants" value={a.restaurants} />
            </ul>
            <Link
              href={`/in/${encodeURIComponent(project.city.toLowerCase())}/area/${encodeURIComponent(project.locality.toLowerCase().replace(/\s+/g, "-"))}`}
              className="mt-4 inline-flex text-[13px] font-semibold text-brand-700 hover:underline"
            >
              See full locality insights →
            </Link>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function Fact({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="surface-card flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
        <p className="text-[14px] font-bold text-ink-900 capitalize">{value}</p>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <li className="rounded-xl bg-ink-50/60 p-3 text-center">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="text-display-sm font-display text-ink-900">{value}</p>
    </li>
  );
}
