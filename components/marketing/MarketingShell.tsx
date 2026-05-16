import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

interface Crumb { label: string; href?: string }

interface MarketingShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  jsonLd?: object | object[];
}

export function MarketingShell({
  eyebrow,
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  jsonLd,
}: MarketingShellProps) {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero band */}
        <section className="relative overflow-hidden bg-hero-radial">
          <div className="absolute inset-0 grid-mask opacity-50" aria-hidden />
          <Container size="wide" className="relative py-12 lg:py-16">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav aria-label="Breadcrumb" className="mb-3 text-[12.5px]">
                <ol className="flex flex-wrap items-center gap-1 text-ink-500">
                  {breadcrumbs.map((c, i) => {
                    const last = i === breadcrumbs.length - 1;
                    return (
                      <li key={i} className="inline-flex items-center gap-1">
                        {c.href && !last ? (
                          <Link href={c.href} className="hover:text-brand-600">{c.label}</Link>
                        ) : (
                          <span className={last ? "font-semibold text-ink-800" : undefined}>{c.label}</span>
                        )}
                        {!last && <ChevronRight className="h-3.5 w-3.5 text-ink-300" />}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                {eyebrow && (
                  <p className="text-[12px] font-bold uppercase tracking-wider text-brand-600">
                    {eyebrow}
                  </p>
                )}
                <h1 className="mt-2 text-display-lg font-display text-ink-900 text-balance">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-3 text-[15.5px] leading-relaxed text-ink-600">{subtitle}</p>
                )}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          </Container>
        </section>

        <section className="py-12 lg:py-16">
          <Container size="wide">{children}</Container>
        </section>
      </main>
      <Footer />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd]),
          }}
        />
      )}
    </>
  );
}
