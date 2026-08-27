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
import { useEffect, useMemo } from "react";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFRadio } from "@/components/interactive/RHF/RHFRadio";
import { RHFTextArea } from "@/components/interactive/RHF/RHFTextArea";
import { Button } from "@/components/interactive/Button/Button";
import toast from "react-hot-toast";
import { formatVisitDate } from "@/lib/utils/visit";
import FormSection from "@/components/interactive/inputs/FormSection";
import { HeightWeightChart } from "@/components/vitals/HeightWeightChart";

type VitalsFormValues = {
  height?: string | null;
  weight?: string | null;
  temperature?: string | null;
  systolic?: string | number | null;
  diastolic?: string | number | null;
  heartRate?: string | number | null;
  hemocueCount?: string | null;
  diabetesMellitus: string;
  urineTest?: string | null;
  bloodGlucoseNonFasting?: string | null;
  bloodGlucoseFasting?: string | null;
  hba1c?: string | null;
  others?: string | null;
  visitSelect: string;
};

export default function PatientVitalsPage() {
  const router = useRouter();
  const { id } = router.query;
  const methods = useForm();
  const { setValue } = methods;

  // Fetch patient
  const { data: patient, isLoading: patientLoading } =
    trpc.patientsRouter.getById.useQuery({ id: Number(id) }, { enabled: !!id });

  // Fetch visits
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

  // Automatically select visit if only got one
  useEffect(() => {
    if (visits && visits.length == 1) {
      setValue("visitSelect", visits[0].id.toString());
    }
  }, [visits, setValue]);

  // Ensure the router is fully initialized and patientId exists
  if (!router.isReady || patientLoading || visitsLoading) {
    return (
      <LoadingSpinner
        message="Loading patient and visits..."
        className="p-12"
      />
    );
  }

  // Only check if patient is missing AFTER we are certain the query ran
  if (!patient) {
    return (
      <div className="p-5 text-center font-semibold text-red-500">
        Patient not found
      </div>
    );
  }

  // Only get selected visit when explicitly chosen from dropdown
  const selectedVisit = selectedVisitValue
    ? visits?.find((v) => v.id.toString() === selectedVisitValue)
    : null;

  return (
    <div className="min-h-screen flex-1 p-4 bg-slate-50">
      <div className="w-full mx-auto max-w-5xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Vitals", href: "/vitals" },
            { label: `Vitals for — ${patient.name}` },
          ]}
        />

        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Patient Vitals — {patient.name}
          </h1>
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
                    Filling up vitals form for visit on{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedVisit
                        ? formatVisitDate(selectedVisit.date)
                        : "-"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                  No visits found for patient.
                </div>
              )}
            </div>

            <div className="bg-slate-50/50 p-6">
              {selectedVisit ? (
                <VitalsForm visitId={selectedVisit.id} patient={patient} />
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
  );
}

function VitalsForm({
  visitId,
  patient,
}: {
  visitId: number;
  patient: { dateOfBirth: Date; gender: "male" | "female" };
}) {
  const {
    reset,
    handleSubmit,
    control,
    formState: { isDirty },
  } = useFormContext<VitalsFormValues>();

  const heightValue = useWatch({ control, name: "height" });
  const weightValue = useWatch({ control, name: "weight" });

  const patientAge = useMemo(() => {
    const now = new Date();
    const dob = new Date(patient.dateOfBirth);
    return Math.floor(
      (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );
  }, [patient.dateOfBirth]);

  const chartHeight = heightValue ? parseFloat(String(heightValue)) : null;
  const chartWeight = weightValue ? parseFloat(String(weightValue)) : null;
  const showChart =
    chartHeight !== null &&
    chartWeight !== null &&
    !isNaN(chartHeight) &&
    !isNaN(chartWeight) &&
    chartHeight > 0 &&
    chartWeight > 0;

  const { data: vitalData, isLoading: vitalsLoading } =
    trpc.vitalsRouter.getByVisitId.useQuery(
      { visitId: visitId },
      { enabled: !!visitId },
    );

  const utils = trpc.useUtils();

  const createVitalsMutation = trpc.vitalsRouter.create.useMutation({
    onSuccess: () => {
      utils.vitalsRouter.getByVisitId.invalidate({ visitId });
      toast.success("Vitals saved successfully!");
    },
    onError: () => {
      toast.error("Failed to save vitals.");
    },
  });

  const updateVitalsMutation = trpc.vitalsRouter.updateByVisitId.useMutation({
    onSuccess: () => {
      utils.vitalsRouter.getByVisitId.invalidate({ visitId });
      toast.success("Vitals saved successfully!");
    },
    onError: () => {
      toast.error("Failed to save vitals.");
    },
  });

  useEffect(() => {
    if (vitalData) {
      reset({
        ...vitalData,
        diabetesMellitus:
          vitalData.diabetesMellitus === true
            ? "true"
            : vitalData.diabetesMellitus === false
              ? "false"
              : "",
        visitSelect: visitId.toString(), // Keeps the dropdown populated with the active data
      });
    } else if (!vitalsLoading) {
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
        visitSelect: visitId.toString(), // Keeps the dropdown populated for new records
      });
    }
  }, [vitalData, vitalsLoading, reset, visitId]);

  if (vitalsLoading)
    return <LoadingSpinner message="Loading Vitals" className="p-12" />;

  const onSubmit = (data: VitalsFormValues) => {
    if (!isDirty) {
      toast("No form field changed!");
      return;
    }

    // Send `null` (not `undefined`) for cleared fields so they are explicitly
    // set to NULL on update — `undefined` is skipped by Drizzle and would leave
    // the previous value untouched.
    const payload = {
      visitId: visitId,
      height: data.height || null,
      weight: data.weight || null,
      temperature: data.temperature || null,
      systolic: data.systolic ? Number(data.systolic) : null,
      diastolic: data.diastolic ? Number(data.diastolic) : null,
      heartRate: data.heartRate ? Number(data.heartRate) : null,
      hemocueCount: data.hemocueCount || null,
      diabetesMellitus: data.diabetesMellitus
        ? data.diabetesMellitus === "true"
        : null,
      urineTest: data.urineTest || null,
      bloodGlucoseNonFasting: data.bloodGlucoseNonFasting || null,
      bloodGlucoseFasting: data.bloodGlucoseFasting || null,
      hba1c: data.hba1c || null,
      others: data.others || null,
    };

    if (!vitalData) {
      createVitalsMutation.mutate(payload);
    } else {
      updateVitalsMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Body measurements */}
      <FormSection
        title="Body Measurements"
        description="General physical measurements."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RHFInput
            name="height"
            label="Height (cm)"
            type="number"
            step="0.1"
          />
          <RHFInput
            name="weight"
            label="Weight (kg)"
            type="number"
            step="0.01"
          />
          <RHFInput
            name="temperature"
            label="Body Temperature (°C)"
            type="number"
            step="0.1"
          />
        </div>
      </FormSection>

      {/* Cardiovascular */}
      <FormSection
        title="Cardiovascular"
        description="Blood pressure and heart rate readings."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RHFInput
            name="systolic"
            label="Systolic Blood Pressure (mmHg)"
            type="number"
          />
          <RHFInput
            name="diastolic"
            label="Diastolic Blood Pressure (mmHg)"
            type="number"
          />
          <RHFInput name="heartRate" label="Heart Rate (BPM)" type="number" />
        </div>
      </FormSection>

      {/* Blood & metabolic */}
      <FormSection
        title="Blood & Metabolic"
        description="Blood glucose, haemoglobin and diabetes status."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RHFInput
            name="bloodGlucoseFasting"
            label="Fasting Blood Glucose (mmol/L)"
            type="number"
            step="0.01"
          />
          <RHFInput
            name="bloodGlucoseNonFasting"
            label="Non-Fasting Blood Glucose (mmol/L)"
            type="number"
            step="0.01"
          />
          <RHFInput
            name="hba1c"
            label="HbA1c Level (%)"
            type="number"
            step="0.01"
          />
          <RHFInput
            name="hemocueCount"
            label="Hemocue Hemoglobin Count (g/dL)"
            type="number"
            step="0.01"
          />
        </div>
        <div className="mt-6">
          <RHFRadio
            name="diabetesMellitus"
            label="Diabetes Mellitus History Status Flag"
            radioOptions={[
              { label: "Positive", value: "true" },
              { label: "Negative", value: "false" },
            ]}
          />
        </div>
      </FormSection>

      {/* Urinalysis */}
      <FormSection title="Urinalysis" description="Urine test findings.">
        <RHFTextArea
          name="urineTest"
          label="Urinalysis Diagnostics (Leukocytes, Nitrites, Protein notes)"
          rows={3}
        />
      </FormSection>

      {/* Additional remarks */}
      <FormSection
        title="Additional Remarks"
        description="Any additional clinical notes."
      >
        <RHFTextArea
          name="others"
          label="Additional Clinical Remarks"
          rows={3}
        />
      </FormSection>

      <div className="flex justify-end pt-2">
        <div className="w-full md:w-44">
          <Button
            type="submit"
            title="Save Records"
            colour="emerald"
            loading={
              createVitalsMutation.isPending || updateVitalsMutation.isPending
            }
          />
        </div>
      </div>

      {showChart && (
        <FormSection
          title="Growth Charts"
          description="Height (blue) and weight (red) plotted on the NCHS growth chart for this patient's age and gender."
        >
          <HeightWeightChart
            age={patientAge}
            height={chartHeight!}
            weight={chartWeight!}
            gender={patient.gender}
          />
        </FormSection>
      )}
    </form>
  );
}

PatientVitalsPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(
    <PatientTopMenuLayout getPatientLink={(id) => `/vitals/${id}`}>
      {page}
    </PatientTopMenuLayout>,
  );
