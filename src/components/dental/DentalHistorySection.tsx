import FormSection from "@/components/interactive/inputs/FormSection";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFRadio } from "@/components/interactive/RHF/RHFRadio";
import {
  RadioOption,
  toOptions,
  yesNoOptions,
} from "@/components/dental/dentalFormUtils";
import type { DentalScalarField } from "@/components/dental/dentalFormValues";
import {
  brushingFrequencyValues,
  sugarConsumptionValues,
  yesNoUnknownValues,
} from "@/lib/constants/dental";

const yesNoUnknownOptions = toOptions(yesNoUnknownValues);

// Ordered to match the mockup's row-by-row reading order.
const historyFields: {
  name: DentalScalarField;
  label: string;
  options: RadioOption[];
}[] = [
  {
    name: "previousDentalVisit",
    label: "Previous dental visit",
    options: yesNoUnknownOptions,
  },
  {
    name: "previousDentalTreatment",
    label: "Previous dental treatment",
    options: yesNoUnknownOptions,
  },
  { name: "toothache", label: "Toothache", options: yesNoOptions },
  { name: "extraction", label: "Extraction", options: yesNoOptions },
  { name: "dentalTrauma", label: "Dental trauma", options: yesNoOptions },
  {
    name: "currentToothache",
    label: "Current toothache",
    options: yesNoOptions,
  },
  {
    name: "toothSensitivity",
    label: "Tooth sensitivity",
    options: yesNoOptions,
  },
  { name: "bleedingGums", label: "Bleeding gums", options: yesNoOptions },
  {
    name: "brushingFrequency",
    label: "Brushing frequency",
    options: toOptions(brushingFrequencyValues),
  },
  {
    name: "fluorideToothpaste",
    label: "Fluoride toothpaste",
    options: yesNoUnknownOptions,
  },
  {
    name: "sugarConsumption",
    label: "Sugar consumption",
    options: toOptions(sugarConsumptionValues),
  },
];

/**
 * **Important:** Must be rendered inside a `FormProvider` whose values include
 * `DentalScalarFormValues`.
 */
export function DentalHistorySection() {
  return (
    <FormSection
      title="Dental History"
      description="Past dental care, current symptoms and oral habits."
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2 lg:grid-cols-3">
        {historyFields.map((field) => (
          <RHFRadio
            key={field.name}
            name={field.name}
            label={field.label}
            radioOptions={field.options}
            layout="inline"
          />
        ))}
      </div>
      <RHFInput
        name="otherDentalHistory"
        label="Other dental history (optional)"
        type="text"
        placeholder="e.g. braces, previous filling..."
        maxLength={255}
      />
    </FormSection>
  );
}
