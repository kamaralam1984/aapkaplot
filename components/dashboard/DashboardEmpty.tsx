import type { LucideIcon } from "lucide-react";

interface DashboardEmptyProps {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}

export function DashboardEmpty({ icon: Icon, title, body, action }: DashboardEmptyProps) {
  return (
    <div className="surface-card grid place-items-center px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-[15px] font-bold text-ink-900">{title}</h2>
      <p className="mt-1 max-w-md text-[13.5px] text-ink-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
