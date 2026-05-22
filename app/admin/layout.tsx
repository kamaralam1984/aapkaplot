import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/auth-server";
import { isAdminRole } from "@/lib/session";
import { prisma } from "@/server/db";
import { MOCK_MODERATION } from "@/lib/mock-dashboard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/admin");

  // Strict role check. When the DB is on, trust the DB; otherwise fall back
  // to the role baked into the signed session cookie.
  if (process.env.USE_DB === "1") {
    const u = await prisma.user
      .findUnique({ where: { id: session.uid }, select: { role: true } })
      .catch(() => null);
    if (u?.role !== "ADMIN" && u?.role !== "SUPER_ADMIN") {
      redirect("/?error=forbidden");
    }
  } else if (!isAdminRole(session.role)) {
    redirect("/?error=forbidden");
  }

  const openModeration = MOCK_MODERATION.filter((m) => m.status === "open").length;

  return (
    <DashboardShell
      brand={{ label: "Admin", tone: "violet" }}
      user={{ name: session.name ?? "Admin", phone: session.phone, email: session.email, role: "admin" }}
      nav={[
        { href: "/admin",              label: "Overview",      icon: "dashboard" },
        { href: "/admin/properties",   label: "Properties",    icon: "ads" },
        { href: "/admin/promotions",   label: "Promotions",    icon: "ads" },
        { href: "/admin/moderation",   label: "Moderation",    icon: "shield", badge: openModeration || undefined },
        { href: "/admin/fraud",        label: "AI Fraud",      icon: "sparkles" },
        { href: "/admin/users",        label: "Users",         icon: "users" },
        { href: "/admin/verifications", label: "Verifications", icon: "shield" },
        { href: "/admin/seo",          label: "SEO Pages",     icon: "seo" },
        { href: "/admin/ai-tools",     label: "AI Studio",     icon: "sparkles" },
        { href: "/admin/analytics",    label: "Analytics",     icon: "analytics" },
        { href: "/admin/events",       label: "Events",        icon: "activity" },
        { href: "/admin/heatmap",      label: "Heatmap",       icon: "activity" },
        { href: "/admin/ads",          label: "Ads",           icon: "ads" },
        { href: "/admin/performance",  label: "Performance",   icon: "activity" },
        { href: "/admin/system-log",   label: "System log",    icon: "activity" },
        { href: "/admin/audit",        label: "Audit log",     icon: "activity" },
        { href: "/admin/visitors",     label: "Visitors",      icon: "users" },
        { href: "/admin/revenue",      label: "Revenue",       icon: "activity" },
        { href: "/admin/database",     label: "Database",      icon: "activity" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
