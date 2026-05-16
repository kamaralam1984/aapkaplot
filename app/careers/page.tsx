import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Briefcase, Sparkles, Heart, Rocket, Globe } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Careers at AapKaPlot — open roles & culture",
  description: "Join AapKaPlot — we're hiring engineers, designers and growth folks to rebuild Indian real estate. Hybrid, Kolkata-first.",
  alternates: { canonical: "/careers" },
};

const ROLES = [
  { dept: "Engineering", title: "Senior Full-Stack Engineer (Next.js + Postgres)", location: "Kolkata / Remote", type: "Full-time" },
  { dept: "Engineering", title: "Mobile Engineer (React Native)", location: "Kolkata / Remote", type: "Full-time" },
  { dept: "AI / ML", title: "ML Engineer — Property Recommendations", location: "Bengaluru / Remote", type: "Full-time" },
  { dept: "Design", title: "Senior Product Designer", location: "Kolkata", type: "Full-time" },
  { dept: "Growth", title: "Growth Manager — Performance Marketing", location: "Mumbai / Remote", type: "Full-time" },
  { dept: "Operations", title: "City Lead — Pune", location: "Pune", type: "Full-time" },
];

const PERKS = [
  { icon: <Heart className="h-5 w-5" />, title: "Health + dental for you & family" },
  { icon: <Rocket className="h-5 w-5" />, title: "ESOPs from day one" },
  { icon: <Globe className="h-5 w-5" />, title: "Remote-friendly, in-person quarterly" },
  { icon: <Sparkles className="h-5 w-5" />, title: "₹50k learning budget every year" },
];

export default function CareersPage() {
  const jsonLd = ROLES.map((r) => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: r.title,
    description: `${r.dept} role at AapKaPlot — ${r.type}`,
    hiringOrganization: { "@type": "Organization", name: "AapKaPlot" },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: r.location, addressCountry: "IN" } },
    employmentType: r.type.toUpperCase().replace(/-/g, "_"),
    datePosted: new Date().toISOString().split("T")[0],
  }));

  return (
    <MarketingShell
      eyebrow="Careers"
      title="Build the future of property in India"
      subtitle="We're hiring across engineering, AI, design, growth and operations. Remote-friendly, ESOPs from day one, real impact on millions of homes."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Careers" }]}
      jsonLd={jsonLd}
    >
      {/* Perks */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PERKS.map((p) => (
          <li key={p.title} className="surface-card flex items-start gap-3 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{p.icon}</span>
            <p className="text-[13.5px] font-semibold text-ink-900">{p.title}</p>
          </li>
        ))}
      </ul>

      {/* Open roles */}
      <section className="mt-14">
        <h2 className="text-display-md font-display text-ink-900">Open roles · {ROLES.length}</h2>
        <p className="mt-1 text-[14px] text-ink-600">Don't see your fit? Email <a href="mailto:careers@aapkaplot.com" className="font-semibold text-brand-600 hover:underline">careers@aapkaplot.com</a></p>

        <ul className="mt-6 surface-card divide-y divide-ink-200/70 overflow-hidden">
          {ROLES.map((r) => (
            <li key={r.title} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-ink-500">
                  <Briefcase className="h-3 w-3" /> {r.dept}
                </p>
                <p className="mt-1 text-[14.5px] font-bold text-ink-900">{r.title}</p>
                <p className="mt-0.5 inline-flex items-center gap-2 text-[12.5px] text-ink-500">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.location}</span>
                  <span>·</span>
                  <span>{r.type}</span>
                </p>
              </div>
              <Link href={`/contact?role=${encodeURIComponent(r.title)}`}>
                <Button variant="outline" size="sm">Apply</Button>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="mt-14 rounded-3xl bg-brand-gradient p-8 text-center text-white lg:p-12">
        <h3 className="text-display-md font-display">Refer a friend, get ₹25,000</h3>
        <p className="mx-auto mt-2 max-w-xl text-[14.5px] text-white/85">
          Send us someone we hire, and we'll send you a referral bonus on their joining date. Email <span className="font-semibold">careers@aapkaplot.com</span>.
        </p>
      </section>
    </MarketingShell>
  );
}
