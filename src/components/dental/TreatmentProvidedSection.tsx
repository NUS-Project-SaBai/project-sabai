import FormSection from "@/components/interactive/inputs/FormSection";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFRadio } from "@/components/interactive/RHF/RHFRadio";
import { toOptions } from "@/components/dental/dentalFormUtils";
import { doneNotDoneValues } from "@/lib/constants/dental";

type TreatmentPrefix = "fluoride" | "sealant" | "sdf" | "scaling";

const treatments: { prefix: TreatmentPrefix; label: string }[] = [
  { prefix: "fluoride", label: "Fluoride" },
  { prefix: "sealant", label: "Sealant" },
  { prefix: "sdf", label: "SDF" },
  { prefix: "scaling", label: "Scaling" },
];

const doneNotDoneOptions = toOptions(doneNotDoneValues);

/**
 * **Important:** Must be rendered inside a `FormProvider` whose values include
 * `DentalScalarFormValues`.
 *
 * One row per treatment: status pills, then free-text operator and tooth
 * number. The text inputs keep their labels for screen readers but only show
 * placeholders, as each row already names the treatment.
 */
export function TreatmentProvidedSection() {
  return (
    <FormSection title="Treatment Provided">
      <div className="divide-y divide-slate-100">
        {treatments.map(({ prefix, label }) => (
          <div
            key={prefix}
            className="grid grid-cols-1 gap-x-4 gap-y-2 py-3 md:grid-cols-[minmax(0,1.2fr)_1fr_1fr] md:items-center"
          >
            <RHFRadio
              name={`${prefix}Status`}
              label={label}
              radioOptions={doneNotDoneOptions}
              layout="inline"
              className="flex flex-wrap items-center gap-x-3 [&>label]:w-20 [&>label]:font-semibold [&>p]:hidden"
            />
            <RHFInput
              name={`${prefix}Operator`}
              label={`${label} operator`}
              type="text"
              placeholder="Operator"
              maxLength={255}
              className="[&>label]:sr-only"
            />
            <RHFInput
              name={`${prefix}ToothNumber`}
              label={`${label} tooth no.`}
              type="text"
              placeholder="Tooth no."
              maxLength={255}
              className="[&>label]:sr-only"
            />
          </div>
        ))}
      </div>
    </FormSection>
  );
}
