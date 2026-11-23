import type { Dental } from "@/db/schema/dental";
import FormSection from "@/components/interactive/inputs/FormSection";
import { RHFRadio } from "@/components/interactive/RHF/RHFRadio";
import {
  absentPresentOptions,
  BooleanString,
  fromBoolean,
  RadioOption,
  toBoolean,
  toOptions,
} from "@/components/dental/dentalFormUtils";
import {
  absentPresentNotAssessedValues,
  cariesValues,
  facialSymmetryValues,
  healthyInflamedBleedingValues,
  malocclusionValues,
  normalLimitedValues,
  oralHygieneValues,
  plaqueValues,
} from "@/lib/constants/dental";

type FacialSymmetry = (typeof facialSymmetryValues)[number];
type AbsentPresentNotAssessed = (typeof absentPresentNotAssessedValues)[number];
type NormalLimited = (typeof normalLimitedValues)[number];
type OralHygiene = (typeof oralHygieneValues)[number];
type Plaque = (typeof plaqueValues)[number];
type GingivalCondition = (typeof healthyInflamedBleedingValues)[number];
type Caries = (typeof cariesValues)[number];
type Malocclusion = (typeof malocclusionValues)[number];

export type ClinicalExaminationFormValues = {
  // Extraoral
  facialSymmetry: FacialSymmetry | "";
  facialSwelling: BooleanString | "";
  lymphadenopathy: AbsentPresentNotAssessed | "";
  mouthOpening: NormalLimited | "";
  // Intraoral
  oralHygiene: OralHygiene | "";
  plaque: Plaque | "";
  calculus: BooleanString | "";
  gingivalCondition: GingivalCondition | "";
  caries: Caries | "";
  missingTeeth: BooleanString | "";
  fracturedTeeth: BooleanString | "";
  mucosalLesions: BooleanString | "";
  malocclusion: Malocclusion | "";
};

export const clinicalExaminationDefaultValues: ClinicalExaminationFormValues = {
  facialSymmetry: "",
  facialSwelling: "",
  lymphadenopathy: "",
  mouthOpening: "",
  oralHygiene: "",
  plaque: "",
  calculus: "",
  gingivalCondition: "",
  caries: "",
  missingTeeth: "",
  fracturedTeeth: "",
  mucosalLesions: "",
  malocclusion: "",
};

type ClinicalExaminationRecord = Pick<
  Dental,
  keyof ClinicalExaminationFormValues
>;

/** Maps a saved record (or none) to form values; `null` columns become "". */
export function toClinicalExaminationFormValues(
  record: ClinicalExaminationRecord | null,
): ClinicalExaminationFormValues {
  if (!record) return clinicalExaminationDefaultValues;
  return {
    facialSymmetry: record.facialSymmetry ?? "",
    facialSwelling: fromBoolean(record.facialSwelling),
    lymphadenopathy: record.lymphadenopathy ?? "",
    mouthOpening: record.mouthOpening ?? "",
    oralHygiene: record.oralHygiene ?? "",
    plaque: record.plaque ?? "",
    calculus: fromBoolean(record.calculus),
    gingivalCondition: record.gingivalCondition ?? "",
    caries: record.caries ?? "",
    missingTeeth: fromBoolean(record.missingTeeth),
    fracturedTeeth: fromBoolean(record.fracturedTeeth),
    mucosalLesions: fromBoolean(record.mucosalLesions),
    malocclusion: record.malocclusion ?? "",
  };
}

/**
 * Maps form values to the router payload. Unanswered fields are sent as
 * `null` (not `undefined`) so clearing a field actually clears it on update.
 */
export function toClinicalExaminationPayload(
  values: ClinicalExaminationFormValues,
) {
  return {
    facialSymmetry: values.facialSymmetry || null,
    facialSwelling: toBoolean(values.facialSwelling),
    lymphadenopathy: values.lymphadenopathy || null,
    mouthOpening: values.mouthOpening || null,
    oralHygiene: values.oralHygiene || null,
    plaque: values.plaque || null,
    calculus: toBoolean(values.calculus),
    gingivalCondition: values.gingivalCondition || null,
    caries: values.caries || null,
    missingTeeth: toBoolean(values.missingTeeth),
    fracturedTeeth: toBoolean(values.fracturedTeeth),
    mucosalLesions: toBoolean(values.mucosalLesions),
    malocclusion: values.malocclusion || null,
  };
}

type ExaminationField = {
  name: keyof ClinicalExaminationFormValues;
  label: string;
  options: RadioOption[];
};

const extraoralFields: ExaminationField[] = [
  {
    name: "facialSymmetry",
    label: "Facial symmetry",
    options: toOptions(facialSymmetryValues),
  },
  {
    name: "facialSwelling",
    label: "Facial swelling",
    options: absentPresentOptions,
  },
  {
    name: "lymphadenopathy",
    label: "Lymphadenopathy",
    options: toOptions(absentPresentNotAssessedValues),
  },
  {
    name: "mouthOpening",
    label: "Mouth opening",
    options: toOptions(normalLimitedValues),
  },
];

const intraoralFields: ExaminationField[] = [
  {
    name: "oralHygiene",
    label: "Oral hygiene",
    options: toOptions(oralHygieneValues),
  },
  { name: "plaque", label: "Plaque", options: toOptions(plaqueValues) },
  { name: "calculus", label: "Calculus", options: absentPresentOptions },
  {
    name: "gingivalCondition",
    label: "Gingival condition",
    options: toOptions(healthyInflamedBleedingValues),
  },
  { name: "caries", label: "Caries", options: toOptions(cariesValues) },
  {
    name: "missingTeeth",
    label: "Missing teeth",
    options: absentPresentOptions,
  },
  {
    name: "fracturedTeeth",
    label: "Fractured teeth",
    options: absentPresentOptions,
  },
  {
    name: "mucosalLesions",
    label: "Mucosal lesions",
    options: absentPresentOptions,
  },
  {
    name: "malocclusion",
    label: "Malocclusion",
    options: toOptions(malocclusionValues),
  },
];

function ExaminationGroup({
  title,
  fields,
}: {
  title: string;
  fields: ExaminationField[];
}) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <RHFRadio
            key={field.name}
            name={field.name}
            label={field.label}
            radioOptions={field.options}
            layout="inline"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * **Important:** Must be rendered inside a `FormProvider` whose values include
 * `ClinicalExaminationFormValues`.
 */
export function ClinicalExaminationSection() {
  return (
    <FormSection
      title="Clinical Examination"
      description="Extraoral and intraoral findings."
    >
      <div className="space-y-4">
        <ExaminationGroup
          title="A. Extraoral examination"
          fields={extraoralFields}
        />
        <ExaminationGroup
          title="B. Intraoral examination"
          fields={intraoralFields}
        />
      </div>
    </FormSection>
  );
}
