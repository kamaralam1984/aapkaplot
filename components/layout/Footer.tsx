import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube, MapPin, Mail, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { Container } from "./Container";

const COLUMNS = [
  {
    title: "Buy a Property",
    links: [
      { label: "Flats in Kolkata", href: "#" },
      { label: "Plots Near Me", href: "#" },
      { label: "Independent Houses", href: "#" },
      { label: "Villas", href: "#" },
      { label: "Agricultural Land", href: "#" },
    ],
  },
  {
    title: "Rent / Lease",
    links: [
      { label: "Apartments for Rent", href: "#" },
      { label: "PG / Coliving", href: "#" },
      { label: "Commercial Spaces", href: "#" },
      { label: "Shops for Lease", href: "#" },
      { label: "Office Space", href: "#" },
    ],
  },
  {
    title: "For Owners",
    links: [
      { label: "Post Property Free", href: "#" },
      { label: "Premium Listings", href: "#" },
      { label: "Verified Owner Badge", href: "#" },
      { label: "Seller Dashboard", href: "#" },
      { label: "Pricing", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About AapKaPlot", href: "#" },
      { label: "AI & Technology", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-ink-200/70 bg-surface-subtle">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
      <Container size="wide" className="py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr_1fr]">
          {/* Brand */}
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-ink-600">
              India's AI-powered real estate platform. Find nearby plots, houses, flats and commercial property with live maps and satellite view.
            </p>
            <div className="mt-6 space-y-2 text-[13.5px] text-ink-600">
              <p className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-500" /> Kolkata, West Bengal, India
              </p>
              <p className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-500" /> hello@aapkaplot.com
              </p>
              <p className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-500" /> +91 80000 00000
              </p>
            </div>
          </div>

          {/* Columns */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-[13px] font-semibold uppercase tracking-wider text-ink-900">
                  {col.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-[13.5px] text-ink-600 transition hover:text-brand-600"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-wider text-ink-900">
              Stay in the loop
            </h4>
            <p className="mt-4 text-[13.5px] text-ink-600">
              New properties, price drops, and AI investment picks in your area.
            </p>
            <form className="mt-4 flex w-full overflow-hidden rounded-xl border border-ink-200 bg-white shadow-soft">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-transparent px-3.5 py-2.5 text-sm placeholder:text-ink-400 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-brand-gradient px-4 text-sm font-semibold text-white transition hover:brightness-105"
              >
                Subscribe
              </button>
            </form>
            <div className="mt-6 flex gap-2">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-ink-200 bg-white text-ink-700 transition hover:border-brand-500/40 hover:text-brand-600"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-ink-200/70 pt-6 text-[12.5px] text-ink-500 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} AapKaPlot. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="#" className="hover:text-ink-800">Privacy</Link>
            <Link href="#" className="hover:text-ink-800">Terms</Link>
            <Link href="#" className="hover:text-ink-800">Cookies</Link>
            <Link href="#" className="hover:text-ink-800">Sitemap</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
