import { ReactNode } from "react";
import { useRouter } from "next/router";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/utils/trpc";
import { PatientPhoto } from "@/components/PatientPhoto";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import { formatPatientCode } from "@/lib/utils/patient";

function ConsultsPage() {
  const router = useRouter();
  const {
    data: patients,
    isLoading,
    isError,
  } = trpc.patientsRouter.list.useQuery();

  const startConsult = (patientId: number) =>
    router.push(`/consults/${patientId}`);

  function renderContent() {
    if (isError) {
      return <h1 className="text-red-500">An error has occurred!</h1>;
    }

    if (isLoading) {
      return <LoadingSpinner message="Loading patients..." className="p-12" />;
    }

    if (!patients || patients.length === 0) {
      return (
        <div className="p-12 text-center text-slate-500">
          No patients found. Add patients to record consults.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <TableHeader headers={["ID", "Photo", "Name", "Actions"]} />
          <tbody className="divide-y divide-slate-200 bg-white">
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                    {patient.villageColorHex && (
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: patient.villageColorHex }}
                        title={patient.villageCode ?? undefined}
                      />
                    )}
                    {formatPatientCode(patient.villageCode, patient.id)}
                  </span>
                </TableCell>
                <TableCell>
                  <PatientPhoto
                    pictureUrl={patient.patientImageUrl}
                    className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                  />
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-900">
                    {patient.name}
                  </span>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => startConsult(patient.id)}
                    title="Start Consult"
                    className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white transition hover:bg-emerald-700"
                  >
                    <HiOutlinePencilSquare className="h-5 w-5" />
                    Start Consult
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex-1 p-4">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Consults" }]}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Consults</h1>
        <p className="mt-2 text-slate-600">
          Select a patient to record a consultation.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
}

ConsultsPage.getLayout = (page: ReactNode) => withDefaultLayout(page);

export default ConsultsPage;
