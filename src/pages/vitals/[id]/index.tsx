import { useRouter } from "next/router";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";

export default function PatientVitalsPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="min-h-screen flex-1 p-8">
      <div className="w-full mx-auto">
        <div className="flex-1 overflow-y-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Patient Vitals - ID: {id}</h1>
          <p className="text-gray-600 mb-6">Vital signs for patient {id}.</p>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500">
              Patient vitals content will go here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

PatientVitalsPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(
    <PatientTopMenuLayout getPatientLink={(id) => `/vitals/${id}`}>
      {page}
    </PatientTopMenuLayout>,
  );
