import FormSection from "@/components/interactive/inputs/FormSection";
import { RHFRadio } from "@/components/interactive/RHF/RHFRadio";
import {
  absentPresentOptions,
  RadioOption,
  toOptions,
} from "@/components/dental/dentalFormUtils";
import type { DentalScalarField } from "@/components/dental/dentalFormValues";
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

type ExaminationField = {
  name: DentalScalarField;
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
 * `DentalScalarFormValues`.
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
