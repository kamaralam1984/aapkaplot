import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/auth-server";
import { MOCK_MODERATION } from "@/lib/mock-dashboard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/admin");
  // NOTE: in prod also gate on session.role === "admin"; mock allows all.

  const openModeration = MOCK_MODERATION.filter((m) => m.status === "open").length;

  return (
    <DashboardShell
      brand={{ label: "Admin", tone: "violet" }}
      user={{ name: session.name ?? "Admin", phone: session.phone, role: "admin" }}
      nav={[
        { href: "/admin",            label: "Overview",   icon: "dashboard" },
        { href: "/admin/moderation", label: "Moderation", icon: "shield", badge: openModeration || undefined },
        { href: "/admin/fraud",      label: "AI Fraud",   icon: "sparkles" },
        { href: "/admin/users",      label: "Users",      icon: "users" },
        { href: "/admin/analytics",  label: "Analytics",  icon: "analytics" },
        { href: "/admin/events",     label: "Events",     icon: "activity" },
        { href: "/admin/heatmap",    label: "Heatmap",    icon: "activity" },
        { href: "/admin/ads",        label: "Ads",        icon: "ads" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
