import { useRouter } from "next/router";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/utils/trpc";
import { PatientPhoto } from "@/components/PatientPhoto";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import { ReactNode } from "react";
import { PatientsRouterListWithLatestVisitItem } from "@/utils/trpc-types";
import { PatientCode } from "@/components/PatientCode";

function UpdateGlassesButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Update Glasses"
      className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white transition hover:bg-emerald-700"
    >
      <HiOutlinePencilSquare className="h-5 w-5" />
      Update Glasses
    </button>
  );
}

/**
 * Stacked patient card used on small screens (e.g mobile)
 */
function PatientCard({
  patient,
  onUpdateGlasses,
}: {
  patient: PatientsRouterListWithLatestVisitItem;
  onUpdateGlasses: (patientId: number) => void;
}) {
  return (
    <div className="flex gap-10 p-4">
      <PatientPhoto
        pictureUrl={patient.patientImageUrl}
        className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <PatientCode
          villageCode={patient.villageCode}
          villageColorHex={patient.villageColorHex}
          id={patient.id}
          className="text-xs font-medium text-slate-500"
        />
        <div className="break-words text-sm font-medium text-slate-900">
          {patient.name}
        </div>
        <UpdateGlassesButton onClick={() => onUpdateGlasses(patient.id)} />
      </div>
    </div>
  );
}

/**
 * Full patient table shown on tablet and desktop screens.
 */
function PatientTable({
  patients,
  onUpdateGlasses,
}: {
  patients: PatientsRouterListWithLatestVisitItem[];
  onUpdateGlasses: (patientId: number) => void;
}) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full divide-y divide-slate-200">
        <TableHeader headers={["ID", "Photo", "Name", "Actions"]} />
        <tbody className="bg-white divide-y divide-slate-200">
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>
                <PatientCode
                  villageCode={patient.villageCode}
                  villageColorHex={patient.villageColorHex}
                  id={patient.id}
                  className="text-sm font-medium text-slate-900"
                />
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
                <UpdateGlassesButton
                  onClick={() => onUpdateGlasses(patient.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex-1 p-4 sm:p-6">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Vision" }]}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Vision</h1>
        <p className="mt-2 text-slate-600">
          Manage vision prescriptions and eye care records for all patients.
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function VisionPage() {
  const router = useRouter();
  const {
    data: patients,
    isLoading,
    isError,
  } = trpc.patientsRouter.listWithLatestVisit.useQuery();

  /**
   * Navigates to the update glasses page for a specific patient.
   * @param {number} patientId - The ID of the patient to update glasses for
   */
  const handleUpdateGlasses = (patientId: number) => {
    router.push(`/vision/update-glasses/${patientId}`);
  };

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
          No patients found. Add patients to manage their vision records.
        </div>
      );
    }

    return (
      <>
        {/* Mobile screens: stacked cards */}
        <div className="divide-y divide-slate-200 md:hidden">
          {patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onUpdateGlasses={handleUpdateGlasses}
            />
          ))}
        </div>

        {/* Tablet and desktop screens: full table */}
        <PatientTable
          patients={patients}
          onUpdateGlasses={handleUpdateGlasses}
        />
      </>
    );
  }

  return <Wrapper>{renderContent()}</Wrapper>;
}

VisionPage.getLayout = (page: ReactNode) => withDefaultLayout(page);

export default VisionPage;
