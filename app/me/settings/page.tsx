import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { SettingsForm } from "./SettingsForm";
import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/me/settings");

  let initial: {
    name: string;
    email: string;
    phone: string;
    whatsappPhone: string;
    address: string;
    role: string;
  } = {
    name: session.name ?? "",
    email: session.email ?? "",
    phone: "",
    whatsappPhone: "",
    address: "",
    role: "BUYER",
  };

  if (process.env.USE_DB === "1") {
    const u = await prisma.user
      .findUnique({
        where: { id: session.uid },
        select: { name: true, email: true, phone: true, whatsappPhone: true, address: true, role: true },
      })
      .catch(() => null);
    if (u) {
      const phone = u.phone?.startsWith("email:") ? "" : (u.phone ?? "");
      initial = {
        name: u.name ?? "",
        email: u.email ?? session.email ?? "",
        phone,
        whatsappPhone: u.whatsappPhone ?? "",
        address: u.address ?? "",
        role: u.role,
      };
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Your account"
        title="Account settings"
        subtitle="Manage your profile, notifications and security preferences."
      />
      <SettingsForm initial={initial} />
    </div>
  );
}
