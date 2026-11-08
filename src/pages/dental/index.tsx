import PageHeader from "@/components/PageHeader";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
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
        description="Manage dental patients here"
      />
    </div>
  );
}

DentalPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(
    <PatientTopMenuLayout getPatientLink={(id) => `/dental/${id}`}>
      {page}
    </PatientTopMenuLayout>,
  );
