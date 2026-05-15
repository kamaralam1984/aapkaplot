import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { NewListingForm } from "@/components/seller/NewListingForm";

export default function NewListingPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="New listing"
        title="Post your property"
        subtitle="Takes about 3 minutes. We'll verify and publish within 24 hours."
      />
      <NewListingForm />
    </div>
  );
}
