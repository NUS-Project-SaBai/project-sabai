import { genderValues, type Gender } from "@/db/schema/patients";

export type { Gender };

// Generate form options from the schema values instead of maintaining a
// second hardcoded list in each patient form.
export const genderDropdown = genderValues.map((gender) => ({
  label: gender.charAt(0).toUpperCase() + gender.slice(1),
  value: gender,
}));
