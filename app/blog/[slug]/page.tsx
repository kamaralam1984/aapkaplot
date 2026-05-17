import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { listBlogSlugs, loadBlogPost } from "@/lib/blog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await listBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadBlogPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.excerpt,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.excerpt,
      images: post.frontmatter.cover ? [{ url: post.frontmatter.cover, width: 1600, height: 900 }] : undefined,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description: post.frontmatter.excerpt,
      images: post.frontmatter.cover ? [post.frontmatter.cover] : undefined,
    },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await loadBlogPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.frontmatter.title,
    description: post.frontmatter.excerpt,
    datePublished: post.frontmatter.date,
    author: { "@type": "Organization", name: post.frontmatter.author ?? "AapKaPlot" },
    image: post.frontmatter.cover ? [post.frontmatter.cover] : undefined,
  };

  return (
    <>
      <Navbar />
      <main className="pb-16">
        <Container size="wide" className="pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-500 hover:text-ink-800"
          >
            <ArrowLeft className="h-4 w-4" /> All posts
          </Link>

          <article className="mx-auto mt-6 max-w-3xl">
            {post.frontmatter.category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wider text-brand-700">
                {post.frontmatter.category}
              </span>
            )}
            <h1 className="mt-3 text-display-lg font-display text-ink-900">
              {post.frontmatter.title}
            </h1>
            <p className="mt-3 inline-flex items-center gap-3 text-[12.5px] text-ink-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(post.frontmatter.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
              {post.frontmatter.readMin && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {post.frontmatter.readMin} min read
                  </span>
                </>
              )}
              {post.frontmatter.author && (
                <>
                  <span>·</span>
                  <span>{post.frontmatter.author}</span>
                </>
              )}
            </p>

            {post.frontmatter.cover && (
              <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-ink-100">
                <Image
                  src={post.frontmatter.cover}
                  alt={post.frontmatter.title}
                  fill
                  sizes="(min-width:768px) 768px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <div className="prose prose-ink mt-8 max-w-none prose-headings:font-display prose-headings:text-ink-900 prose-a:text-brand-700 prose-strong:text-ink-900">
              <MDXRemote source={post.body} />
            </div>
          </article>
        </Container>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
