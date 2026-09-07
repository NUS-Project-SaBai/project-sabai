import type { DropdownOption } from "@/components/interactive/RHF/RHFDropdown";

export const PEDIATRIC_AGE_THRESHOLD = 18;

export const SCOLIOSIS_OPTIONS: DropdownOption[] = [
  { label: "Normal", value: "normal" },
  { label: "Abnormal", value: "abnormal" },
];

export const PALLOR_OPTIONS: DropdownOption[] = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

export const PUBARCHE_OPTIONS: DropdownOption[] = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];
