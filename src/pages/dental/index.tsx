import PageHeader from "@/components/PageHeader";
import { paths } from "@/utils/paths";

export default function DentalPage() {
  return (
    <div className="min-h-screen flex-1 p-8">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: paths.home() },
          { label: "Dental" },
        ]}
        title="Dental"
        description="Dental module coming soon."
      />
      <p className="mt-2 text-slate-600">Dental module place here.</p>
    </div>
  );
}
