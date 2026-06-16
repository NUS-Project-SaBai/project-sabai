import { useRouter } from "next/router";
import {
  FormProvider,
  useForm,
  useWatch,
  useFormContext,
} from "react-hook-form";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/utils/trpc";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { useEffect } from "react";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFRadio } from "@/components/interactive/RHF/RHFRadio";
import { RHFTextArea } from "@/components/interactive/RHF/RHFTextArea";
import { Button } from "@/components/interactive/Button/Button";
import { CreateVitalsInput } from "@/server/routers/vitals_router";

export default function PatientVitalsPage() {
  const router = useRouter();
  const { id } = router.query;
  const methods = useForm();

  //fetch patient
  const { data: patient, isLoading: patientLoading } =
    trpc.patientsRouter.getById.useQuery({ id: Number(id) }, { enabled: !!id });

  //fetch visits
  const { data: visits, isLoading: visitsLoading } =
    trpc.visitsRouter.getByPatientId.useQuery(
      { patientId: Number(id) },
      { enabled: !!id },
    );

  // Watch the form field to get selected visit (must be before early returns)
  const selectedVisitValue = useWatch({
    control: methods.control,
    name: "visitSelect",
  });

  //Automatically select visit if only got one
  useEffect(() => {
    if (visits && visits.length == 1) {
      methods.setValue("visitSelect", visits[0].id.toString());
    }
  }, [visits, methods]);

  // 1. Ensure the router is fully initialized and patientId exists
  if (!router.isReady || patientLoading || visitsLoading) {
    return <LoadingSpinner message="Loading patient and visits..." />;
  }

  // 2. Only check if patient is missing AFTER we are certain the query ran
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
    <div className="min-h-screen flex-1 p-8 bg-slate-50">
      <div className="w-full mx-auto max-w-5xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Vitals", href: "/Vitals" },
            { label: `Vitals for - ${patient.name}` },
          ]}
        />

        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Patient Vitals Matrix — {patient.name}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <FormProvider {...methods}>
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                {visits && visits.length > 0 ? (
                  <div className="max-w-md">
                    <RHFDropdown
                      name="visitSelect"
                      label="Choose visit"
                      dropdownOptions={visits.map((visit) => ({
                        label: formatVisitDate(visit.date),
                        value: visit.id.toString(),
                      }))}
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                    No visits found for patient.
                  </div>
                )}
              </div>

              <div className="p-6">
                {selectedVisit ? (
                  <div className="mb-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block mb-1">
                      Filling up vitals form for visit on{" "}
                      {formatVisitDate(selectedVisit.date)}
                    </span>
                    <VitalsForm visitId={selectedVisit.id} />
                  </div>
                ) : (
                  visits &&
                  visits.length > 0 && (
                    <div className="text-center py-12 text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-xl">
                      Please choose a visit to view vitals.
                    </div>
                  )
                )}
              </div>
            </FormProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalsForm({ visitId }: { visitId: number }) {
  const { reset, handleSubmit } = useFormContext();

  const { data: vitalData, isLoading: vitalsLoading } =
    trpc.vitalsRouter.getByVisitId.useQuery(
      { visitId: visitId },
      { enabled: !!visitId },
    );

  const utils = trpc.useUtils();

  const updateVitalsMutation = trpc.vitalsRouter.updateByVisitId.useMutation({
    onSuccess: () => {
      utils.vitalsRouter.getByVisitId.invalidate({ visitId });
    },
    onError: () => {
      alert("Database update operation failure: ${error.message}");
    },
  });

  useEffect(() => {
    if (vitalData) {
      reset(vitalData);
    } else if (!vitalsLoading) {
      // Reset sheet contents to blank if no existing record row matches this visitId row index
      reset({
        height: "",
        weight: "",
        temperature: "",
        systolic: "",
        diastolic: "",
        heartRate: "",
        hemocueCount: "",
        diabetesMellitus: "",
        urineTest: "",
        bloodGlucoseNonFasting: "",
        bloodGlucoseFasting: "",
        hba1c: "",
        others: "",
      });
    }
  }, [vitalData, vitalsLoading, reset]);

  if (vitalsLoading) return <LoadingSpinner message="Loading Vitals" />;

  const onSubmit = (data: CreateVitalsInput) => {
    updateVitalsMutation.mutate({
      visitId: visitId,
      height: data.height || undefined,
      weight: data.weight || undefined,
      temperature: data.temperature || undefined,
      systolic: data.systolic ? Number(data.systolic) : undefined,
      diastolic: data.diastolic ? Number(data.diastolic) : undefined,
      heartRate: data.heartRate ? Number(data.heartRate) : undefined,
      hemocueCount: data.hemocueCount || undefined,
      diabetesMellitus:
        data.diabetesMellitus === "true"
          ? true
          : data.diabetesMellitus === "false"
            ? false
            : undefined,
      urineTest: data.urineTest || undefined,
      bloodGlucoseNonFasting: data.bloodGlucoseNonFasting || undefined,
      bloodGlucoseFasting: data.bloodGlucoseFasting || undefined,
      hba1c: data.hba1c || undefined,
      others: data.others || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/*normal body stuff*/}
      <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RHFInput name="height" label="Height (cm)" type="number" />
          <RHFInput name="weight" label="Weight (kg)" type="number" />
          <RHFInput
            name="temperature"
            label="Body Temperature (°C)"
            type="number"
          />
        </div>
      </section>

      {/*Cardiovascular */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RHFInput
            name="systolic"
            label="Systiolic Blood Pressure (mmHg)"
            type="number"
          />
          <RHFInput
            name="diastolic"
            label="Diastolic Blood Pressure (mmHg)"
            type="number"
          />
          <RHFInput name="heartRate" label="Heart Rate (BPM)" type="number" />
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RHFInput
            name="bloodGlucoseFasting"
            label="Fasting Blood Glucose (mmol/L)"
            type="number"
          />
          <RHFInput
            name="bloodGlucoseNonFasting"
            label="Non-Fasting Blood Glucose (mmol/L)"
            type="number"
          />
          <RHFInput name="hba1c" label="HbA1c Level (%)" type="number" />
          <RHFInput
            name="hemocueCount"
            label="Hemocue Hemoglobin Count (g/dL)"
            type="number"
          />
        </div>
        <div className="mt-4">
          <RHFRadio
            name="diabetesMellitus"
            label="Diabetes Metiitus History Status Flag"
            radioOptions={[
              { label: "Positive", value: "true" },
              { label: "Negative", value: "false" },
            ]}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-4">
          <RHFTextArea
            name="urineTest"
            label="Urinalysis Diagnostics (Leukocytes, Nitrites, Protein notes)"
            rows={3}
          />
          <RHFTextArea
            name="others"
            label="Additional Clinical Remarks"
            rows={3}
          />
        </div>
      </section>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <div className="w-full md:w-44">
          <Button
            type="submit"
            title="Save Records"
            colour="white"
            variant="filled"
            loading={updateVitalsMutation.isPending}
          />
        </div>
      </div>
    </form>
  );
}

PatientVitalsPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(
    <PatientTopMenuLayout getPatientLink={(id) => `/vitals/${id}`}>
      {page}
    </PatientTopMenuLayout>,
  );
