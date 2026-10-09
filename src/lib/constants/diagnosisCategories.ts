import type { DropdownOption } from "@/components/interactive/RHF/RHFDropdown";

/**
 * Clinical list of diagnosis categories.
 *
 * To be SSOT (Single Source of Truth) shared between the client dropdown and the
 * server-side validation.
 */
export const DIAGNOSIS_CATEGORIES = [
  "Cardiovascular",
  "Dermatology",
  "Ear Nose Throat",
  "Endocrine",
  "Eye",
  "Gastrointestinal",
  "Haematology",
  "Infectious Diseases",
  "Renal & Genitourinary",
  "Respiratory",
  "Musculoskeletal",
  "Neurology",
  "Obstetrics & Gynaecology",
  "Oral Health",
  "Others",
] as const;

export type DiagnosisCategory = (typeof DIAGNOSIS_CATEGORIES)[number];

/**
 * The diagnosis categories formatted as RHFDropdown options.
 */
export const DIAGNOSIS_CATEGORY_OPTIONS: DropdownOption[] =
  DIAGNOSIS_CATEGORIES.map((category) => ({
    label: category,
    value: category,
  }));
