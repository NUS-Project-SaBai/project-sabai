import { genderValues, type Gender } from "@/db/schema/patients";

export type { Gender };

export const genderDropdown = genderValues.map((gender) => ({
  label: gender.charAt(0).toUpperCase() + gender.slice(1),
  value: gender,
}));
