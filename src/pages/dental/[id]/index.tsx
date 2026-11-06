import { useEffect } from "react";
import { useRouter } from "next/router";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import Breadcrumbs from "@/components/Breadcrumbs";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import { formatPatientId } from "@/lib/utils/patient";
import { formatVisitDate } from "@/lib/utils/visit";
import { trpc } from "@/utils/trpc";

export default function PatientDentalPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!router.isReady) {
    return (
      <LoadingSpinner
        message="Loading patient and visits..."
        className="p-12"
      />
    );
  }

  const patientId =
    typeof id === "string" && /^\d+$/.test(id) ? Number(id) : NaN;
  if (
    !Number.isSafeInteger(patientId) ||
    patientId <= 0 ||
    patientId > 2147483647
  ) {
    return (
      <div className="p-8 text-center font-semibold text-red-500">
        Patient not found
      </div>
    );
  }

  return <PatientDentalContent key={patientId} patientId={patientId} />;
}

function PatientDentalContent({ patientId }: { patientId: number }) {
  const methods = useForm<{ visitSelect: string }>({
    defaultValues: { visitSelect: "" },
  });
  const { setValue, getValues } = methods;
  const patientQuery = trpc.patientsRouter.getById.useQuery({ id: patientId });
  const visitsQuery = trpc.visitsRouter.getByPatientId.useQuery({ patientId });
  const visits = visitsQuery.data;
  const selectedVisitValue = useWatch({
    control: methods.control,
    name: "visitSelect",
  });

  useEffect(() => {
    if (!visits) return;
    const current = getValues("visitSelect");
    if (!visits.some((visit) => visit.id.toString() === current)) {
      setValue("visitSelect", visits[0]?.id.toString() ?? "");
    }
  }, [visits, getValues, setValue]);

  if (patientQuery.isLoading || visitsQuery.isLoading) {
    return (
      <LoadingSpinner
        message="Loading patient and visits..."
        className="p-12"
      />
    );
  }
  if (patientQuery.isError || visitsQuery.isError) {
    return (
      <div className="p-8 text-center font-semibold text-red-500">
        Unable to load patient and visits. Please try again.
      </div>
    );
  }
  const patient = patientQuery.data;
  if (!patient) {
    return (
      <div className="p-8 text-center font-semibold text-red-500">
        Patient not found
      </div>
    );
  }
  const selectedVisit = visits?.find(
    (visit) => visit.id.toString() === selectedVisitValue,
  );

  return (
    <div className="min-h-screen flex-1 p-8 bg-slate-50">
      <div className="w-full mx-auto max-w-5xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Dental", href: "/dental" },
            { label: `Dental - ${patient.name}` },
          ]}
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Patient Dental - {patient.name}
          </h1>
          <p className="mt-2 text-slate-600">
            Patient ID: {formatPatientId(patient.id)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
          <FormProvider {...methods}>
            <div className="p-6 bg-slate-50/50">
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
                    Dental records for visit on{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedVisit
                        ? formatVisitDate(selectedVisit.date)
                        : "-"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                  No visits found for this patient. Please create a visit first.
                </div>
              )}
            </div>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}

PatientDentalPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(
    <PatientTopMenuLayout getPatientLink={(id) => `/dental/${id}`}>
      {page}
    </PatientTopMenuLayout>,
  );
