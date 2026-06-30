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

  // Role check: DB role (when USE_DB=1) OR session role OR SUPER_ADMIN_EMAILS allowlist.
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  const emailIsAdmin = !!session.email && superAdminEmails.includes(session.email.toLowerCase());

  if (process.env.USE_DB === "1") {
    const u = await prisma.user
      .findUnique({ where: { id: session.uid }, select: { role: true } })
      .catch(() => null);
    // Allow if DB role is admin/super_admin, OR email is in the allowlist
    const dbOk = u?.role === "ADMIN" || u?.role === "SUPER_ADMIN";
    if (!dbOk && !emailIsAdmin) {
      redirect("/?error=forbidden");
    }
    // Promote DB role to SUPER_ADMIN on first admin access if email matches
    if (!dbOk && emailIsAdmin && u) {
      await prisma.user.update({ where: { id: session.uid }, data: { role: "SUPER_ADMIN" } }).catch(() => null);
    }
  } else if (!isAdminRole(session.role) && !emailIsAdmin) {
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
        { href: "/admin/outreach",     label: "AI Outreach",   icon: "users" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
