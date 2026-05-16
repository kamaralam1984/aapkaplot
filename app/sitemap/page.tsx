import type { Metadata } from "next";
import Link from "next/link";
import { Home, Search, ListChecks, ShieldCheck, IndianRupee, Mail, Newspaper, Briefcase, FileText, Map as MapIcon, BookOpen, HelpCircle } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { MOCK_PROPERTIES } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Sitemap — AapKaPlot",
  description: "Every public page on AapKaPlot, grouped by topic. For machines: /sitemap.xml",
  alternates: { canonical: "/sitemap" },
};

const SECTIONS = [
  {
    title: "Find a property",
    icon: <Search className="h-4 w-4" />,
    links: [
      { href: "/", label: "Home" },
      { href: "/search", label: "Search all properties" },
      { href: "/search?intent=buy", label: "Buy" },
      { href: "/search?intent=rent", label: "Rent" },
      { href: "/search?kind=flat", label: "Flats" },
      { href: "/search?kind=house", label: "Houses" },
      { href: "/search?kind=plot", label: "Plots" },
      { href: "/search?kind=villa", label: "Villas" },
      { href: "/search?kind=shop", label: "Commercial" },
      { href: "/search?kind=agriculture", label: "Agricultural land" },
    ],
  },
  {
    title: "City landing pages",
    icon: <MapIcon className="h-4 w-4" />,
    links: [
      { href: "/in/kolkata", label: "Kolkata" },
      { href: "/in/bengaluru", label: "Bengaluru" },
      { href: "/in/mumbai", label: "Mumbai" },
      { href: "/in/pune", label: "Pune" },
      { href: "/in/delhi", label: "Delhi NCR" },
      { href: "/in/kolkata/flats", label: "Flats in Kolkata" },
      { href: "/in/kolkata/plots", label: "Plots in Kolkata" },
      { href: "/in/bengaluru/flats", label: "Flats in Bengaluru" },
      { href: "/in/mumbai/flats", label: "Flats in Mumbai" },
    ],
  },
  {
    title: "Sell or list",
    icon: <ListChecks className="h-4 w-4" />,
    links: [
      { href: "/sell", label: "Seller dashboard" },
      { href: "/sell/new", label: "Post a property" },
      { href: "/sell/listings", label: "My listings" },
      { href: "/sell/leads", label: "Leads inbox" },
      { href: "/sell/analytics", label: "Analytics" },
      { href: "/sell/boost", label: "Boost a listing" },
    ],
  },
  {
    title: "Account",
    icon: <Home className="h-4 w-4" />,
    links: [
      { href: "/me", label: "My account" },
      { href: "/me/saved", label: "Saved properties" },
      { href: "/me/visits", label: "My visits" },
      { href: "/me/alerts", label: "Property alerts" },
      { href: "/me/recommendations", label: "AI picks for me" },
      { href: "/me/settings", label: "Account settings" },
      { href: "/chat", label: "Messages" },
      { href: "/referrals", label: "Refer & earn" },
    ],
  },
  {
    title: "Sign in & verify",
    icon: <ShieldCheck className="h-4 w-4" />,
    links: [
      { href: "/auth/login", label: "Sign in / Register" },
      { href: "/auth/verify-docs", label: "Verify Aadhaar / PAN / title docs" },
    ],
  },
  {
    title: "Plans & payments",
    icon: <IndianRupee className="h-4 w-4" />,
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/checkout?plan=premium", label: "Start Premium" },
      { href: "/checkout?plan=featured", label: "Buy Featured boost" },
      { href: "/checkout?plan=turbo", label: "Buy Turbo boost" },
    ],
  },
  {
    title: "Company",
    icon: <Briefcase className="h-4 w-4" />,
    links: [
      { href: "/about", label: "About AapKaPlot" },
      { href: "/ai-technology", label: "AI & Technology" },
      { href: "/careers", label: "Careers" },
      { href: "/press", label: "Press" },
      { href: "/contact", label: "Contact" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Help & legal",
    icon: <HelpCircle className="h-4 w-4" />,
    links: [
      { href: "/help", label: "Help Center" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/cookies", label: "Cookie Policy" },
      { href: "/sitemap.xml", label: "Machine sitemap (XML)" },
      { href: "/robots.txt", label: "robots.txt" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <MarketingShell
      eyebrow="Sitemap"
      title="Every page on AapKaPlot"
      subtitle="Grouped by section, for humans. For search engines, see the machine-readable /sitemap.xml."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sitemap" }]}
    >
      {/* Sections */}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <li key={s.title} className="surface-card p-5">
            <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-ink-500">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">{s.icon}</span>
              {s.title}
            </p>
            <ul className="mt-3 space-y-1">
              {s.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block rounded-md px-2 py-1 text-[13.5px] text-ink-700 hover:bg-ink-100 hover:text-ink-900">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {/* All property detail links — collapsed */}
      <section className="mt-12 surface-card overflow-hidden">
        <header className="border-b border-ink-200/70 px-5 py-3">
          <p className="text-[14px] font-bold text-ink-900">All property detail pages · {MOCK_PROPERTIES.length}</p>
          <p className="text-[12px] text-ink-500">One link per listing. Auto-generated from the live catalogue.</p>
        </header>
        <ul className="grid gap-x-6 gap-y-1 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_PROPERTIES.map((p) => (
            <li key={p.id}>
              <Link href={`/property/${p.id}`} className="block truncate rounded-md px-2 py-1 text-[12.5px] text-ink-700 hover:bg-ink-100 hover:text-ink-900">
                {p.title} · {p.location.locality}, {p.location.city}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </MarketingShell>
  );
}
