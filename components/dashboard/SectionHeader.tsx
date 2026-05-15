interface SectionHeaderProps {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function SectionHeader({ eyebrow, title, subtitle, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-brand-600">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-display-md font-display text-ink-900">{title}</h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-[14px] text-ink-500">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
