import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function VitalsPage() {
  return (
    <div className="min-h-screen flex-1 p-8">
      <div className="w-full mx-auto">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Vitals" }]}
        />
        {/* Header for Vitals */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vitals</h1>
            <p className="mt-2 text-slate-600">
              Manage patient vital signs here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

VitalsPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(
    <PatientTopMenuLayout getPatientLink={(id) => `/vitals/${id}`}>
      {page}
    </PatientTopMenuLayout>,
  );
