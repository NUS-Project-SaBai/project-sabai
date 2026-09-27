import { ReactNode } from "react";
import { trpc } from "@/utils/trpc";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  computeBmi,
  formatBloodPressure,
  formatDiabetes,
} from "@/lib/utils/vitals";

/**
 * A single read-only vitals field
 */
function ReadOnlyField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  const isEmpty =
    value === null || value === undefined || value === "" || value === "-";
  return (
    <div className={className}>
      <p className="mb-1 text-sm font-bold text-slate-900">{label}</p>
      <div className="min-h-[2.5rem] rounded bg-slate-100 px-3 py-2 text-sm text-slate-700">
        {isEmpty ? "-" : value}
      </div>
    </div>
  );
}

function DiabetesField({ value }: { value: boolean | null }) {
  const label = formatDiabetes(value);
  return (
    <div>
      <p className="mb-1 text-sm font-bold text-slate-900">Diabetes</p>
      <div className="min-h-[2.5rem] rounded bg-slate-100 px-3 py-2 text-sm">
        <span
          className={
            value === true ? "font-semibold text-red-600" : "text-slate-700"
          }
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function VitalsGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-slate-600">{title}</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{children}</div>
    </div>
  );
}

/**
 * Read-only panel showing the vitals and vision (eyesight) recorded for a
 * visit, displayed alongside consult form for doctor / medical student to reference.
 */
export function VisitSummaryPanel({ visitId }: { visitId: number }) {
  const { data: vitals, isLoading: vitalsLoading } =
    trpc.vitalsRouter.getByVisitId.useQuery({ visitId });
  const { data: eyesight, isLoading: eyesightLoading } =
    trpc.eyesightRouter.getByVisitId.useQuery({ visitId });

  if (vitalsLoading || eyesightLoading) {
    return <LoadingSpinner message="Loading vitals..." className="p-6" />;
  }

  const bloodPressure = formatBloodPressure(
    vitals?.systolic,
    vitals?.diastolic,
  );

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Vitals</h2>
        {vitals === null ? (
          <p className="text-sm text-slate-500">
            No vitals recorded for this visit.
          </p>
        ) : (
          <div className="space-y-4">
            <VitalsGroup title="Anthropometric">
              <ReadOnlyField label="Height" value={vitals?.height} />
              <ReadOnlyField label="Weight" value={vitals?.weight} />
              <ReadOnlyField
                label="BMI"
                value={computeBmi(
                  vitals?.height ?? null,
                  vitals?.weight ?? null,
                )}
              />
            </VitalsGroup>

            <VitalsGroup title="Cardiovascular / General">
              <ReadOnlyField label="BP (mmHg)" value={bloodPressure} />
              <ReadOnlyField label="Heart Rate" value={vitals?.heartRate} />
              <ReadOnlyField label="Temperature" value={vitals?.temperature} />
              <ReadOnlyField label="Urine Dip Test" value={vitals?.urineTest} />
              <ReadOnlyField label="Hemocue Hb" value={vitals?.hemocueCount} />
            </VitalsGroup>

            <VitalsGroup title="Metabolic">
              <ReadOnlyField
                label="Non-Fasting BG"
                value={vitals?.bloodGlucoseNonFasting}
              />
              <ReadOnlyField
                label="Fasting BG"
                value={vitals?.bloodGlucoseFasting}
              />
              <ReadOnlyField label="HbA1c" value={vitals?.hba1c} />
              <DiabetesField value={vitals?.diabetesMellitus ?? null} />
            </VitalsGroup>

            <ReadOnlyField
              label="Others"
              value={vitals?.others}
              className="w-full"
            />
          </div>
        )}
      </section>

      {/* Eyesight / Vision section */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Vision</h2>
        {eyesight === null ? (
          <p className="text-sm text-slate-500">
            No vision recorded for this visit.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <ReadOnlyField label="Right Eye" value={eyesight?.rightEyeDegree} />
            <ReadOnlyField label="Left Eye" value={eyesight?.leftEyeDegree} />
            <ReadOnlyField
              label="Right Eye Pinhole"
              value={eyesight?.rightEyePinhole}
            />
            <ReadOnlyField
              label="Left Eye Pinhole"
              value={eyesight?.leftEyePinhole}
            />
          </div>
        )}
      </section>
    </div>
  );
}
