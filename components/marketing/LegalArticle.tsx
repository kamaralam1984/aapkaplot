interface Section { id: string; heading: string; body: React.ReactNode }

interface LegalArticleProps {
  effectiveDate: string;
  sections: Section[];
}

export function LegalArticle({ effectiveDate, sections }: LegalArticleProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
      {/* Sticky TOC */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-[11.5px] font-bold uppercase tracking-wider text-brand-700">
          Effective {effectiveDate}
        </p>
        <ol className="mt-4 space-y-1.5 text-[13px] text-ink-700">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="block rounded-lg px-3 py-1.5 hover:bg-ink-100 hover:text-ink-900">
                {i + 1}. {s.heading}
              </a>
            </li>
          ))}
        </ol>
      </aside>

      {/* Body */}
      <article className="prose prose-ink max-w-none">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-24 [&:not(:first-child)]:mt-10">
            <h2 className="text-[20px] font-bold text-ink-900">
              {i + 1}. {s.heading}
            </h2>
            <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-ink-700">{s.body}</div>
          </section>
        ))}
      </article>
    </div>
  );
}
