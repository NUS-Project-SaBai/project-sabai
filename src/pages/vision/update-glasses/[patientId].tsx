import { useState } from "react";
import { useRouter } from "next/router";
import { FormProvider, useForm } from "react-hook-form";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/utils/trpc";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";

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

  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

  if (patientLoading || visitsLoading) {
    return <LoadingSpinner message="Loading patient and visits..." />;
  }

  if (!patient) {
    return <div>Patient not found</div>;
  }

  // Get the most recent visit as default
  const currentVisit = visits?.[0];
  const selectedVisit =
    visits?.find((v) => v.id === selectedVisitId) || currentVisit;

  const formatVisitDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
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
              Patient ID: {patient.id.toString().padStart(4, "0")}
            </p>
          </div>
        </div>

        <FormProvider {...methods}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {visits && visits.length > 0 ? (
              <div className="mb-6">
                <div className="text-sm text-slate-600 mb-2">
                  Currently viewing vitals for visit on
                </div>
                <div className="text-lg font-semibold text-slate-900 mb-2">
                  {selectedVisit
                    ? formatVisitDate(selectedVisit.date)
                    : "No visit selected"}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select a different visit to compare historical vitals
                  </label>
                  <RHFDropdown
                    name="visitSelect"
                    dropdownOptions={visits.map((visit) => ({
                      label: formatVisitDate(visit.date),
                      value: visit.id.toString(),
                    }))}
                  ></RHFDropdown>
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
