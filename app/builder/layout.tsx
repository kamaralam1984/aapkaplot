import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/auth-server";

export default async function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/builder");

  return (
    <DashboardShell
      brand={{ label: "Builder", tone: "emerald" }}
      user={{
        name:  session.name  ?? "Builder",
        phone: session.phone,
        email: session.email,
        role:  session.role,
      }}
      nav={[
        { href: "/builder",     label: "Overview",  icon: "dashboard" },
        { href: "/builder/crm", label: "CRM Leads", icon: "users" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
