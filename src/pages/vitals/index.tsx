import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import { PatientPhoto } from "@/components/PatientPhoto";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/utils/trpc";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import { useRouter } from "next/router";
import { Button } from "@/components/interactive/Button/Button";
import { CiMedicalClipboard } from "react-icons/ci";

export default function VitalsPage() {
  const router = useRouter();

  /**
   * Navigates to the update glasses page for a specific patient.
   * @param {number} patientId - The ID of the patient to update glasses for
   */
  const handlePatientVitals = (patientId: number) => {
    router.push(`/vitals/${patientId}`);
  };
  //Fetch list of patients
  const {
    data: patients,
    isLoading,
    isError,
  } = trpc.patientsRouter.list.useQuery();

  function renderListOfPatients() {
    if (isError) {
      return <h1 className="text-red-500">An error has occurred!</h1>;
    }

    if (isLoading) {
      return <LoadingSpinner message="Loading patients..." />;
    }

    if (!patients || patients.length === 0) {
      return (
        <div className="p-12 text-center text-slate-500">
          No patients found. Seed the database or add a new record.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <TableHeader headers={["ID", "Photo", "Name", "Actions"]} />
          <tbody className="bg-white divide-y divide-slate-200">
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">
                      {patient.id || "No id found"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <PatientPhoto
                      pictureUrl={patient.patientImageUrl}
                      className="rounded-full border border-slate-200"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">
                      {patient.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handlePatientVitals(patient.id)}
                    title="Vitals"
                    icon={<CiMedicalClipboard className="h-6 w-6" />}
                    colour="emerald"
                    variant="filled"
                    size="medium"
                  />
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {renderListOfPatients()}
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
