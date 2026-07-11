import { useRouter } from "next/router";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/utils/trpc";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { formatVisitDate } from "@/lib/utils/visit";
import { formatPatientId } from "@/lib/utils/patient";
import { ConsultForm } from "@/components/consults/ConsultForm";
import { VisitSummaryPanel } from "@/components/consults/VisitSummaryPanel";

function ConsultsPage() {
  const router = useRouter();
  const { patientId } = router.query;

  // A small form just for the visit selector so it can use `RHFDropdown`.
  const visitForm = useForm<{ visitSelect: string }>({
    defaultValues: { visitSelect: "" },
  });
  const selectedVisitValue = useWatch({
    control: visitForm.control,
    name: "visitSelect",
  });
  const selectedVisitId = selectedVisitValue
    ? Number(selectedVisitValue)
    : null;

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

  // Auto-select the visit when there is only one.
  useEffect(() => {
    if (visits && visits.length === 1) {
      visitForm.setValue("visitSelect", visits[0].id.toString());
    }
  }, [visits, visitForm]);

  if (!router.isReady || patientLoading || visitsLoading) {
    return (
      <LoadingSpinner
        message="Loading patient and visits..."
        className="p-12"
      />
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center font-semibold text-red-500">
        Patient not found
      </div>
    );
  }

  return (
    <div className="min-h-screen flex-1 bg-slate-50 p-8">
      <div className="mx-auto w-full max-w-7xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Consults", href: "/consults" },
            { label: `Consult — ${patient.name}` },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Consult — {patient.name}
          </h1>
          <p className="mt-2 text-slate-600">
            Patient ID: {formatPatientId(patient.id)}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 p-6">
            {visits && visits.length > 0 ? (
              <div className="w-full max-w-md">
                <FormProvider {...visitForm}>
                  <RHFDropdown
                    name="visitSelect"
                    label="Choose visit"
                    placeholder="Select a visit"
                    dropdownOptions={visits.map((visit) => ({
                      label: formatVisitDate(visit.date),
                      value: visit.id.toString(),
                    }))}
                  />
                </FormProvider>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700">
                No visits found for this patient. Please create a visit first to
                record a consult.
              </div>
            )}
          </div>

          <div className="p-6">
            {selectedVisitId ? (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <aside className="lg:border-r lg:border-slate-100 lg:pr-8">
                  <VisitSummaryPanel visitId={selectedVisitId} />
                </aside>
                <ConsultForm key={selectedVisitId} visitId={selectedVisitId} />
              </div>
            ) : (
              visits &&
              visits.length > 0 && (
                <div className="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center font-medium text-slate-400">
                  Please choose a visit to record a consult.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

ConsultsPage.getLayout = (page: React.ReactNode) => withDefaultLayout(page);

export default ConsultsPage;
