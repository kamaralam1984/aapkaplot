/**
 * MDX-driven blog. Posts live in /content/blog/*.mdx with this frontmatter:
 *
 *   ---
 *   title: "First-time buyer's guide"
 *   excerpt: "From Sodepur to Salt Lake — typical prices, key paperwork…"
 *   date: 2026-05-12
 *   category: "Buyer guide"
 *   readMin: 6
 *   cover: "https://images.unsplash.com/photo-…?w=1200"
 *   author: "AapKaPlot Editorial"
 *   ---
 *
 *   # Markdown body here. JSX components allowed via MDXRemote.
 *
 * No CMS, no DB — pure files in the repo. Zero cost.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";

export interface BlogFrontmatter {
  title: string;
  excerpt: string;
  date: string;
  category?: string;
  readMin?: number;
  cover?: string;
  author?: string;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  body: string;
}

const CONTENT_DIR = join(process.cwd(), "content", "blog");

export async function listBlogSlugs(): Promise<string[]> {
  try {
    const files = await readdir(CONTENT_DIR);
    return files
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map((f) => f.replace(/\.mdx?$/i, ""));
  } catch {
    return [];
  }
}

export async function loadBlogPost(slug: string): Promise<BlogPost | null> {
  const safe = slug.replace(/[^a-z0-9-_]/gi, "");
  if (!safe) return null;
  for (const ext of [".mdx", ".md"]) {
    try {
      const raw = await readFile(join(CONTENT_DIR, `${safe}${ext}`), "utf-8");
      const parsed = matter(raw);
      const fm = parsed.data as Partial<BlogFrontmatter>;
      if (!fm.title || !fm.date) continue;
      return {
        slug: safe,
        frontmatter: {
          title: fm.title,
          excerpt: fm.excerpt ?? "",
          date: typeof fm.date === "string" ? fm.date : new Date(fm.date).toISOString(),
          category: fm.category,
          readMin: fm.readMin,
          cover: fm.cover,
          author: fm.author,
        },
        body: parsed.content,
      };
    } catch {
      // try next extension
    }
  }
  return null;
}

export async function listBlogPosts(): Promise<BlogPost[]> {
  const slugs = await listBlogSlugs();
  const posts = await Promise.all(slugs.map((s) => loadBlogPost(s)));
  return posts
    .filter((p): p is BlogPost => !!p)
    .sort((a, b) => +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date));
}
