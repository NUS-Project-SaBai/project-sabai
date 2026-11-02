import Breadcrumbs from "@/components/Breadcrumbs";
import { paths } from "@/utils/paths";

export default function DentalPage() {
  return (
    <div className="min-h-screen flex-1 p-8">
      <Breadcrumbs
        items={[{ label: "Home", href: paths.home() }, { label: "Dental" }]}
      />
      <h1 className="text-3xl font-bold text-slate-900">Dental</h1>
      <p className="mt-2 text-slate-600">Dental module place here.</p>
    </div>
  );
}
