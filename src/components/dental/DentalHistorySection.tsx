import type { Dental } from "@/db/schema/dental";
import FormSection from "@/components/interactive/inputs/FormSection";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFRadio } from "@/components/interactive/RHF/RHFRadio";
import {
  brushingFrequencyValues,
  sugarConsumptionValues,
  yesNoUnknownValues,
} from "@/lib/constants/dental";

type YesNoUnknown = (typeof yesNoUnknownValues)[number];
type BrushingFrequency = (typeof brushingFrequencyValues)[number];
type SugarConsumption = (typeof sugarConsumptionValues)[number];
/** Boolean DB columns are held as strings by RHFRadio; "" means unanswered. */
type BooleanString = "true" | "false";

export type DentalHistoryFormValues = {
  previousDentalVisit: YesNoUnknown | "";
  previousDentalTreatment: YesNoUnknown | "";
  toothache: BooleanString | "";
  extraction: BooleanString | "";
  dentalTrauma: BooleanString | "";
  currentToothache: BooleanString | "";
  toothSensitivity: BooleanString | "";
  bleedingGums: BooleanString | "";
  brushingFrequency: BrushingFrequency | "";
  fluorideToothpaste: YesNoUnknown | "";
  sugarConsumption: SugarConsumption | "";
  otherDentalHistory: string;
};

export const dentalHistoryDefaultValues: DentalHistoryFormValues = {
  previousDentalVisit: "",
  previousDentalTreatment: "",
  toothache: "",
  extraction: "",
  dentalTrauma: "",
  currentToothache: "",
  toothSensitivity: "",
  bleedingGums: "",
  brushingFrequency: "",
  fluorideToothpaste: "",
  sugarConsumption: "",
  otherDentalHistory: "",
};

type DentalHistoryRecord = Pick<Dental, keyof DentalHistoryFormValues>;

const fromBoolean = (value: boolean | null | undefined): BooleanString | "" =>
  value == null ? "" : value ? "true" : "false";
const toBoolean = (value: BooleanString | ""): boolean | null =>
  value === "" ? null : value === "true";

/** Maps a saved record (or none) to form values; `null` columns become "". */
export function toDentalHistoryFormValues(
  record: DentalHistoryRecord | null,
): DentalHistoryFormValues {
  if (!record) return dentalHistoryDefaultValues;
  return {
    previousDentalVisit: record.previousDentalVisit ?? "",
    previousDentalTreatment: record.previousDentalTreatment ?? "",
    toothache: fromBoolean(record.toothache),
    extraction: fromBoolean(record.extraction),
    dentalTrauma: fromBoolean(record.dentalTrauma),
    currentToothache: fromBoolean(record.currentToothache),
    toothSensitivity: fromBoolean(record.toothSensitivity),
    bleedingGums: fromBoolean(record.bleedingGums),
    brushingFrequency: record.brushingFrequency ?? "",
    fluorideToothpaste: record.fluorideToothpaste ?? "",
    sugarConsumption: record.sugarConsumption ?? "",
    otherDentalHistory: record.otherDentalHistory ?? "",
  };
}

/**
 * Maps form values to the router payload. Unanswered fields are sent as
 * `null` (not `undefined`) so clearing a field actually clears it on update.
 */
export function toDentalHistoryPayload(values: DentalHistoryFormValues) {
  return {
    previousDentalVisit: values.previousDentalVisit || null,
    previousDentalTreatment: values.previousDentalTreatment || null,
    toothache: toBoolean(values.toothache),
    extraction: toBoolean(values.extraction),
    dentalTrauma: toBoolean(values.dentalTrauma),
    currentToothache: toBoolean(values.currentToothache),
    toothSensitivity: toBoolean(values.toothSensitivity),
    bleedingGums: toBoolean(values.bleedingGums),
    brushingFrequency: values.brushingFrequency || null,
    fluorideToothpaste: values.fluorideToothpaste || null,
    sugarConsumption: values.sugarConsumption || null,
    otherDentalHistory: values.otherDentalHistory.trim() || null,
  };
}

const capitalise = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const toOptions = (values: readonly string[]) =>
  values.map((value) => ({ label: capitalise(value), value }));

const yesNoOptions = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" },
];
const yesNoUnknownOptions = toOptions(yesNoUnknownValues);

// Ordered to match the mockup's row-by-row reading order.
const historyFields: {
  name: Exclude<keyof DentalHistoryFormValues, "otherDentalHistory">;
  label: string;
  options: { label: string; value: string }[];
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
 * `DentalHistoryFormValues`.
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
