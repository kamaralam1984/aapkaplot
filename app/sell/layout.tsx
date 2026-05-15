import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/auth-server";
import { MOCK_LEADS } from "@/lib/mock-dashboard";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/sell");

  const newLeads = MOCK_LEADS.filter((l) => l.status === "new").length;

  return (
    <DashboardShell
      brand={{ label: "Seller", tone: "sky" }}
      user={{ name: session.name ?? "Seller", phone: session.phone, role: session.role }}
      nav={[
        { href: "/sell",            label: "Overview",       icon: "dashboard" },
        { href: "/sell/listings",   label: "Listings",       icon: "listings" },
        { href: "/sell/leads",      label: "Leads",          icon: "inbox", badge: newLeads || undefined },
        { href: "/sell/new",        label: "Post property",  icon: "plus" },
        { href: "/sell/analytics",  label: "Analytics",      icon: "analytics" },
        { href: "/sell/boost",      label: "Boost",          icon: "rocket" },
        { href: "/me/settings",     label: "Settings",       icon: "settings" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
