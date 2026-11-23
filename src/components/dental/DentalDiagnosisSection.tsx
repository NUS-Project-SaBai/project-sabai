import { useFieldArray, useFormContext } from "react-hook-form";
import { HiOutlineTrash } from "react-icons/hi";
import type { DentalDiagnosis } from "@/db/schema/dental";
import FormSection from "@/components/interactive/inputs/FormSection";
import { Button } from "@/components/interactive/Button/Button";
import { RHFTextArea } from "@/components/interactive/RHF/RHFTextArea";

export type DentalDiagnosisFormValues = {
  // useFieldArray needs objects, so each diagnosis is wrapped.
  diagnoses: { description: string }[];
};

type DentalDiagnosisRecord = { diagnoses: DentalDiagnosis[] };

/** Maps a saved record (or none) to form values, keeping entry order. */
export function toDentalDiagnosisFormValues(
  record: DentalDiagnosisRecord | null,
): DentalDiagnosisFormValues {
  return {
    diagnoses: (record?.diagnoses ?? []).map(({ description }) => ({
      description,
    })),
  };
}

/**
 * Maps form values to the router payload. Always sends the full list so the
 * router replaces the saved diagnoses; blank textboxes are dropped.
 */
export function toDentalDiagnosisPayload(values: DentalDiagnosisFormValues) {
  return {
    diagnoses: values.diagnoses
      .map(({ description }) => description.trim())
      .filter(Boolean),
  };
}

/**
 * **Important:** Must be rendered inside a `FormProvider` whose values include
 * `DentalDiagnosisFormValues`.
 */
export function DentalDiagnosisSection() {
  const { control } = useFormContext<DentalDiagnosisFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "diagnoses",
  });

  return (
    <FormSection title="Dental Diagnosis">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="relative">
            <RHFTextArea
              name={`diagnoses.${index}.description`}
              label={`Diagnosis ${index + 1}`}
              rows={2}
              placeholder="e.g. Dental caries on 36"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Remove diagnosis ${index + 1}`}
              className="absolute right-0 top-0 inline-flex items-center gap-1 rounded p-1 text-sm text-red-600 transition hover:bg-red-50"
            >
              <HiOutlineTrash className="h-4 w-4" />
              Remove
            </button>
          </div>
        ))}
        <Button
          title="Add Diagnosis +"
          colour="indigo"
          variant="outline"
          size="small"
          onClick={() => append({ description: "" })}
        />
      </div>
    </FormSection>
  );
}
