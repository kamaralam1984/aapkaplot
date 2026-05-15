import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/auth-server";
import { MOCK_LEADS, MOCK_VISITS } from "@/lib/mock-dashboard";

export default async function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/me");

  const pendingVisits = MOCK_VISITS.filter((v) => v.status === "pending").length;
  const newLeads = MOCK_LEADS.filter((l) => l.status === "new").length;

  return (
    <DashboardShell
      brand={{ label: "Buyer", tone: "emerald" }}
      user={{ name: session.name ?? "Buyer", phone: session.phone, role: session.role }}
      nav={[
        { href: "/me",                 label: "Overview",   icon: "dashboard" },
        { href: "/me/saved",           label: "Saved",      icon: "heart" },
        { href: "/me/visits",          label: "Visits",     icon: "calendar", badge: pendingVisits || undefined },
        { href: "/me/alerts",          label: "Alerts",     icon: "bell" },
        { href: "/me/recommendations", label: "AI Picks",   icon: "sparkles" },
        { href: "/chat",               label: "Messages",   icon: "messages", badge: newLeads || undefined },
        { href: "/me/settings",        label: "Settings",   icon: "settings" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
