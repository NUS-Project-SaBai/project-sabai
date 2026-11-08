import PageHeader from "@/components/PageHeader";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import { PatientPhoto } from "@/components/PatientPhoto";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import { formatPatientCode } from "@/lib/utils/patient";
import { trpc } from "@/utils/trpc";
import { paths } from "@/utils/paths";
import { useRouter } from "next/router";
import { HiOutlinePencilSquare } from "react-icons/hi2";

export default function DentalPage() {
  const router = useRouter();
  const {
    data: patients,
    isLoading,
    isError,
  } = trpc.patientsRouter.listWithLatestVisit.useQuery();

  const openDentalPage = (patientId: number) =>
    router.push(`/dental/${patientId}`);

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
          No patients found.
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
                    onClick={() => openDentalPage(patient.id)}
                    title="Open Dental"
                    className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white transition hover:bg-emerald-700"
                  >
                    <HiOutlinePencilSquare className="h-5 w-5" />
                    Open Dental
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
    <div className="min-h-screen flex-1 p-8">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: paths.home() },
          { label: "Dental" },
        ]}
        title="Dental"
        description="Manage dental patients here"
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
}

DentalPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(
    <PatientTopMenuLayout getPatientLink={(id) => `/dental/${id}`}>
      {page}
    </PatientTopMenuLayout>,
  );
