import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { LogViewer } from "./LogViewer";

export const dynamic = "force-dynamic";

export default function SystemLogPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Diagnostics"
        title="System log"
        subtitle="Tail of PM2's aapkaplot process logs (stdout + stderr). Filter by level or search a string."
      />
      <LogViewer />
    </div>
  );
}
