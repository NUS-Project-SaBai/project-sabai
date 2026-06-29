import { useRouter } from "next/router";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useEffect } from "react";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/utils/trpc";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { EyesightForm, EyesightFormValues } from "@/components/vision/EyesightForm";
import { formatVisitDate } from "@/lib/utils/visit";
import { formatPatientId } from "@/lib/utils/patient";

type UpdateGlassesFormValues = EyesightFormValues & { visitSelect: string };

function UpdateGlassesPage() {
  const router = useRouter();
  const { patientId } = router.query;
  const methods = useForm<UpdateGlassesFormValues>();

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

  // Automatically select visit if only got one
  useEffect(() => {
    if (visits && visits.length === 1) {
      methods.setValue("visitSelect", visits[0].id.toString());
    }
  }, [visits, methods]);

  if (!router.isReady || patientLoading || visitsLoading) {
    return <LoadingSpinner message="Loading patient and visits..." />;
  }

  if (!patient) {
    return (
      <div className="p-8 text-center font-semibold text-red-500">
        Patient not found
      </div>
    );
  }

  // Only get selected visit when explicitly chosen from dropdown
  const selectedVisit = selectedVisitValue
    ? visits?.find((v) => v.id.toString() === selectedVisitValue)
    : null;

  return (
    <div className="min-h-screen flex-1 p-8 bg-slate-50">
      <div className="w-full mx-auto max-w-5xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Vision", href: "/vision" },
            { label: `Update Glasses — ${patient.name}` },
          ]}
        />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Update Glasses — {patient.name}
            </h1>
            <p className="mt-2 text-slate-600">
              Patient ID: {formatPatientId(patient.id)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <FormProvider {...methods}>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              {visits && visits.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-center">
                  <div className="w-full max-w-md">
                    <RHFDropdown
                      name="visitSelect"
                      label="Choose visit"
                      dropdownOptions={visits.map((visit) => ({
                        label: formatVisitDate(visit.date),
                        value: visit.id.toString(),
                      }))}
                    />
                  </div>
                  <div className="text-center text-sm text-slate-600">
                    Filling up vision form for visit on{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedVisit
                        ? formatVisitDate(selectedVisit.date)
                        : "-"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                  No visits found for this patient. Please create a visit first
                  to update glasses prescription.
                </div>
              )}
            </div>

            <div className="p-6">
              {selectedVisit ? (
                <EyesightForm
                  visitId={selectedVisit.id}
                  visitSelect={selectedVisitValue ?? ""}
                />
              ) : (
                visits &&
                visits.length > 0 && (
                  <div className="text-center py-12 text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-xl">
                    Please choose a visit to view vision data.
                  </div>
                )
              )}
            </div>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}

UpdateGlassesPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(page);

export default UpdateGlassesPage;
