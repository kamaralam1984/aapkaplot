import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { listBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — AapKaPlot",
  description:
    "Insights on Indian real estate — buying guides, market trends, neighbourhood deep-dives and tips from AapKaPlot.",
  alternates: { canonical: "/blog" },
};

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=70";

export default async function BlogPage() {
  const posts = await listBlogPosts();

  if (posts.length === 0) {
    return (
      <MarketingShell
        eyebrow="Blog"
        title="Blog coming soon"
        subtitle="Drop MDX files into /content/blog/*.mdx and they'll appear here."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]}
      >
        <p className="text-[14px] text-ink-500">
          Posts will be auto-listed once content/blog/*.mdx exists.
        </p>
      </MarketingShell>
    );
  }

  const [hero, ...rest] = posts;
  const categories = Array.from(
    new Set(["All", ...posts.map((p) => p.frontmatter.category).filter(Boolean)])
  ) as string[];

  return (
    <MarketingShell
      eyebrow="Blog"
      title="Smart property reads from the AapKaPlot team"
      subtitle="Buying guides, market deep-dives, legal explainers and engineering posts — written for Indian buyers, sellers and investors."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]}
    >
      {/* Category chips (visual only — filtering hits the search route) */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <span
            key={c}
            className={
              "rounded-full border px-3 py-1.5 text-[12.5px] font-semibold " +
              (c === "All"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-ink-200 bg-white text-ink-700")
            }
          >
            {c}
          </span>
        ))}
      </div>

      {/* Hero post */}
      <article className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Link href={`/blog/${hero.slug}`} className="group block overflow-hidden rounded-2xl">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-100">
            <Image
              src={hero.frontmatter.cover ?? FALLBACK_COVER}
              alt={hero.frontmatter.title}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              priority
            />
          </div>
        </Link>
        <div className="flex flex-col justify-center">
          {hero.frontmatter.category && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wider text-brand-700">
              {hero.frontmatter.category}
            </span>
          )}
          <h2 className="mt-3 text-display-md font-display text-ink-900">
            <Link href={`/blog/${hero.slug}`} className="hover:underline">
              {hero.frontmatter.title}
            </Link>
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-600">{hero.frontmatter.excerpt}</p>
          <p className="mt-4 inline-flex items-center gap-3 text-[12.5px] text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(hero.frontmatter.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
            {hero.frontmatter.readMin && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {hero.frontmatter.readMin} min
                </span>
              </>
            )}
          </p>
          <Link
            href={`/blog/${hero.slug}`}
            className="mt-5 inline-flex w-fit items-center gap-1 rounded-xl bg-brand-gradient px-4 py-2.5 text-[13.5px] font-bold text-white shadow-glow"
          >
            Read article <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </article>

      {/* Recent grid */}
      {rest.length > 0 && (
        <>
          <h3 className="mt-14 text-display-md font-display text-ink-900">Recent posts</h3>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <li
                key={p.slug}
                className="surface-card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <Link href={`/blog/${p.slug}`} className="relative aspect-[16/10] w-full overflow-hidden bg-ink-100">
                  <Image
                    src={p.frontmatter.cover ?? FALLBACK_COVER}
                    alt={p.frontmatter.title}
                    fill
                    sizes="(min-width: 1024px) 30vw, 100vw"
                    className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                  />
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  {p.frontmatter.category && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-brand-700">
                      {p.frontmatter.category}
                    </span>
                  )}
                  <h4 className="text-[15.5px] font-bold leading-snug text-ink-900">
                    <Link href={`/blog/${p.slug}`} className="hover:underline">{p.frontmatter.title}</Link>
                  </h4>
                  <p className="line-clamp-2 text-[12.5px] text-ink-600">{p.frontmatter.excerpt}</p>
                  <p className="mt-auto inline-flex items-center gap-3 text-[11.5px] text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(p.frontmatter.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </span>
                    {p.frontmatter.readMin && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {p.frontmatter.readMin} min
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Subscribe band */}
      <section className="mt-14 rounded-3xl bg-brand-gradient p-8 text-white lg:p-12">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h3 className="text-display-md font-display">Get the weekly newsletter</h3>
            <p className="mt-2 max-w-xl text-[14.5px] text-white/85">
              One email every Friday — new listings near you, market signals, and the best long-reads from the AapKaPlot team.
            </p>
          </div>
          <form className="flex h-12 overflow-hidden rounded-xl border border-white/40 bg-white/10 backdrop-blur">
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 bg-transparent px-3 text-[14px] text-white placeholder:text-white/60 focus:outline-none"
            />
            <button type="submit" className="bg-white px-5 text-[13.5px] font-bold text-emerald-700 hover:brightness-95">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </MarketingShell>
  );
}
