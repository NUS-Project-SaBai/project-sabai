import { useRouter } from "next/router";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/utils/trpc";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { formatPatientId } from "@/lib/utils/patient";

function UpdateGlassesPage() {
  const router = useRouter();
  const { patientId } = router.query;
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

  if (patientLoading || visitsLoading) {
    return (
      <LoadingSpinner
        message="Loading patient and visits..."
        className="p-12"
      />
    );
  }

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
            { label: "Vision", href: "/vision" },
            { label: `Update Glasses - ${patient.name}` },
          ]}
        />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Update Glasses - {patient.name}
            </h1>
            <p className="mt-2 text-slate-600">
              Patient ID: {formatPatientId(patient.id)}
            </p>
          </div>
        </div>

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
                    label="Select a different visit to compare historical vision data"
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
                  No visits found for this patient. Please create a visit first
                  to update glasses prescription.
                </p>
              </div>
            )}

            <div className="text-slate-500">
              Vision prescription form will be implemented here...
            </div>
          </div>
        </FormProvider>
      </div>
    </div>
  );
}

UpdateGlassesPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(page);

export default UpdateGlassesPage;
