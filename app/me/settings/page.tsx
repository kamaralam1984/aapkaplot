import { User, Mail, Phone, ShieldCheck, BellRing, Lock } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/Button";
import { getSession } from "@/lib/auth-server";

export default async function SettingsPage() {
  const s = await getSession();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Your account"
        title="Account settings"
        subtitle="Manage your profile, notifications and security preferences."
      />

      <Card title="Profile" icon={<User className="h-4 w-4" />}>
        <Row label="Full name"   value={s?.name ?? "Add your name"} action="Edit" />
        <Row label="Email"       value={s?.email ?? "—"} action="Change" badge={<VerifiedBadge />} icon={<Mail className="h-3.5 w-3.5" />} />
        <Row label="Phone"       value={s?.phone ?? "Add your phone"} action="Add" icon={<Phone className="h-3.5 w-3.5" />} />
      </Card>

      <Card title="Verification" icon={<ShieldCheck className="h-4 w-4" />}>
        <Row label="Aadhaar verification"    value="Not verified"      action="Verify now" />
        <Row label="PAN verification"        value="Not verified"      action="Verify now" />
        <Row label="Property docs (sellers)" value="N/A"               action="Upload" />
      </Card>

      <Card title="Notifications" icon={<BellRing className="h-4 w-4" />}>
        <Toggle label="WhatsApp price-drop alerts"    enabled />
        <Toggle label="Daily AI recommendations"      enabled />
        <Toggle label="Visit reminders (SMS)"         enabled />
        <Toggle label="Marketing emails"              enabled={false} />
      </Card>

      <Card title="Security" icon={<Lock className="h-4 w-4" />}>
        <Row label="Active sessions" value="1 device · this browser" action="Sign out everywhere" />
        <Row label="Two-factor auth" value="Not enabled" action="Set up" />
      </Card>
    </div>
  );
}

function Card({
  title, icon, children,
}: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="surface-card">
      <header className="flex items-center gap-2 border-b border-ink-200/70 px-5 py-3.5">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
        <h3 className="text-[14px] font-bold text-ink-900">{title}</h3>
      </header>
      <div className="divide-y divide-ink-200/70">{children}</div>
    </section>
  );
}

function Row({
  label, value, action, badge, icon,
}: {
  label: string;
  value: string;
  action: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold text-ink-500">{label}</p>
        <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13.5px] text-ink-900">
          {icon}
          <span className="truncate">{value}</span>
          {badge}
        </p>
      </div>
      <Button variant="ghost" size="sm">{action}</Button>
    </div>
  );
}

function Toggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <p className="text-[13.5px] font-medium text-ink-800">{label}</p>
      <span
        className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-emerald-500" : "bg-ink-200"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-all ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">
      <ShieldCheck className="h-3 w-3" />
      Verified
    </span>
  );
}
