import { useRouter } from "next/router";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/utils/trpc";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { vitals } from "@/db/schema";

export default function PatientVitalsPage() {
  const router = useRouter();
  const { id: patientId } = router.query;
  const methods = useForm();

  const { data: patient, isLoading: patientLoading } =
    trpc.patientsRouter.getById.useQuery(
      { id: Number(patientId) },
      { enabled: !!patientId },
    );

  const { data: visits, isLoading: visitsLoading } =
    trpc.visitsRouter.getByPatientId.useQuery(
      { patientId: Number(patientId) },
      { enabled: !!patientId },
    );

  // Watch the form field to get selected visit (must be before early returns)
  const selectedVisitValue = useWatch({
    control: methods.control,
    name: "visitSelect",
  });

  // 1. Ensure the router is fully initialized and patientId exists
  if (!router.isReady || patientLoading || visitsLoading) {
    return <LoadingSpinner message="Loading patient and visits..." />;
  }

  // 2. Only check if patient is missing AFTER we are certain the query ran
  if (!patient) {
    return <div>Patient not found</div>;
  }

  // Only get selected visit when explicitly chosen from dropdown
  const selectedVisit = selectedVisitValue
    ? visits?.find((v) => v.id.toString() === selectedVisitValue)
    : null;

  /**
   * Formats a visit date into a readable string format.
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string in GB locale
   */
  const formatVisitDate = (date: Date) => {
    return new Date(date).toLocaleString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex-1 p-8">
      <div className="w-full mx-auto">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Vitals", href: "/Vitals" },
            { label: `Vitals for - ${patient.name}` },
          ]}
        />
        <div className="flex-1 overflow-y-auto p-6">
          <h1 className="text-2xl font-bold mb-4">
            Patient Vitals - ID: {patientId}
          </h1>
          <p className="text-gray-600 mb-6">
            Vital signs for patient {patientId}.
          </p>

          <div className="bg-white rounded-lg shadow p-4">
            {selectedVisitValue ? (
              <VitalsForm visitId={selectedVisitValue} />
            ) : (
              <div>No Visits Found</div>
            )}
            <p className="text-gray-500">
              <FormProvider {...methods}>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  {visits && visits.length > 0 ? (
                    <div className="mb-6">
                      {selectedVisit ? (
                        <>
                          <div className="text-sm text-slate-600 mb-2">
                            Currently viewing vision data for visit on
                          </div>
                          <div className="text-lg font-semibold text-slate-900 mb-2">
                            {formatVisitDate(selectedVisit.date)}
                          </div>
                        </>
                      ) : (
                        <div className="text-lg font-semibold text-slate-900 mb-2">
                          No visit selected
                        </div>
                      )}
                      <div className="mb-4">
                        <RHFDropdown
                          name="visitSelect"
                          label="Select a different visit to compare historical vitals data"
                          dropdownOptions={visits.map((visit) => ({
                            label: formatVisitDate(visit.date),
                            value: visit.id.toString(),
                          }))}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-amber-700">
                        No visits found for this patient. Please create a visit
                        first to update glasses prescription.
                      </p>
                    </div>
                  )}

                  <div className="text-slate-500">
                    Vision prescription form will be implemented here...
                  </div>
                </div>
              </FormProvider>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalsForm({ visitId }: { visitId: number }) {
  const { data: vitals, isLoading: vitalsLoading } =
    trpc.vitalsRouter.getByVisitId.useQuery(
      { visitId: visitId },
      { enabled: !!visitId },
    );

  if (vitalsLoading) return <LoadingSpinner message="Loading Vitals" />;

  return <div>Vitals Form inputs goes here</div>;
}

PatientVitalsPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(
    <PatientTopMenuLayout getPatientLink={(id) => `/vitals/${id}`}>
      {page}
    </PatientTopMenuLayout>,
  );

//dropdown listing all the visits of that patient by id
//on selecting that particular visit, get the vitals of that visit
//show the vitals in a from
//special cases: no visits found -> create a visit? Need to clarify route, for now just show that no visit found
//special case only one visit found -> auto display for that
