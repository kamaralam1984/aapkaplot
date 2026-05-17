import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/server/db";

export default async function BrokerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/broker");

  // Allow access to /broker/signup without a profile so first-timers can onboard.
  let profile = null as { id: string } | null;
  let pendingCount = 0;
  if (process.env.USE_DB === "1") {
    profile = await prisma.brokerProfile.findUnique({
      where: { userId: session.uid },
      select: { id: true },
    });
    if (profile) {
      pendingCount = await prisma.brokerReferral.count({
        where: { brokerId: session.uid, status: "pending" },
      });
    }
  }

  return (
    <DashboardShell
      brand={{ label: "Broker", tone: "violet" }}
      user={{ name: session.name ?? "Broker", phone: session.phone, email: session.email, role: session.role }}
      nav={[
        { href: "/broker",             label: "Overview",    icon: "dashboard" },
        { href: "/broker/marketplace", label: "Marketplace", icon: "search" },
        { href: "/broker/referrals",   label: "Referrals",   icon: "users", badge: pendingCount || undefined },
        { href: "/broker/commissions", label: "Commissions", icon: "indianRupee" },
        { href: "/broker/profile",     label: "Profile",     icon: "settings" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
