import Link from "next/link";
import { MapPin, Mail, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { Container } from "./Container";
import { NewsletterForm } from "./NewsletterForm";
import { FooterSocial } from "./FooterSocial";

const COLUMNS = [
  {
    title: "Buy a Property",
    links: [
      { label: "Flats in Kolkata",      href: "/in/kolkata/flats" },
      { label: "Plots in Kolkata",      href: "/in/kolkata/plots" },
      { label: "Houses in Bengaluru",   href: "/in/bengaluru/houses" },
      { label: "Villas in Mumbai",      href: "/in/mumbai/villas" },
      { label: "Agricultural Land",     href: "/search?kind=agriculture" },
    ],
  },
  {
    title: "Rent / Lease",
    links: [
      { label: "Apartments for Rent", href: "/search?intent=rent&kind=flat" },
      { label: "Independent Houses",  href: "/search?intent=rent&kind=house" },
      { label: "Commercial Spaces",   href: "/search?intent=rent&kind=shop" },
      { label: "Office Space",        href: "/search?intent=rent&kind=office" },
      { label: "Warehouse",           href: "/search?intent=rent&kind=warehouse" },
    ],
  },
  {
    title: "For Owners",
    links: [
      { label: "Post Property Free",   href: "/sell/new" },
      { label: "Premium Listings",     href: "/pricing" },
      { label: "Boost a Listing",      href: "/sell/boost" },
      { label: "Verified Owner Badge", href: "/auth/verify-docs" },
      { label: "Seller Dashboard",     href: "/sell" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About AapKaPlot",  href: "/about" },
      { label: "AI & Technology",  href: "/ai-technology" },
      { label: "Careers",          href: "/careers" },
      { label: "Press",            href: "/press" },
      { label: "Blog",             href: "/blog" },
      { label: "Contact",          href: "/contact" },
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
                <MapPin className="h-4 w-4 text-brand-500" /> Sultanganj, Patna, Bihar 800006
              </p>
              <a href="mailto:aapkaplots@gmail.com" className="block hover:text-ink-900">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-brand-500" /> aapkaplots@gmail.com
                </span>
              </a>
              <a href="tel:+917039125391" className="block hover:text-ink-900">
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-brand-500" /> +91 7039125391
                </span>
              </a>
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
            <div className="mt-4">
              <NewsletterForm />
            </div>
            <FooterSocial className="mt-6" />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-ink-200/70 pt-6 text-[12.5px] text-ink-500 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} AapKaPlot Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-ink-800">Privacy</Link>
            <Link href="/terms"   className="hover:text-ink-800">Terms</Link>
            <Link href="/cookies" className="hover:text-ink-800">Cookies</Link>
            <Link href="/sitemap" className="hover:text-ink-800">Sitemap</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
