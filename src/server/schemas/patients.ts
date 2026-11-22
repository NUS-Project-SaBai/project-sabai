import { z } from "zod";
import { genderValues } from "@/db/schema/patients";
import { isFutureDate } from "@/lib/utils/date";

// A yyyy-MM-dd day, as submitted by <input type="date">.
const dateOfBirthDay = z
  .string()
  .min(1, "Missing Date of Birth!")
  .pipe(z.iso.date({ error: "Enter a valid date" }));

export const dateOfBirthSchema = dateOfBirthDay.refine(
  (value) => !isFutureDate(value),
  "Date of Birth cannot be in the future",
);

export const dateOfBirthInput = dateOfBirthSchema.pipe(z.coerce.date());

export const editPatientFormSchema = z.object({
  name: z.string().min(1, "Missing Name!"),
  identificationNumber: z.string().min(1, "Missing Identification Number!"),
  contactNo: z.string().min(1, "Missing Contact Number!"),
  gender: z.enum(genderValues, { error: "Missing Gender!" }),
  drugAllergy: z.string().min(1, "Missing Drug Allergy!"),
  dateOfBirth: dateOfBirthSchema,
  hasPoorCard: z.boolean(),
  hasBS2Card: z.boolean(),
  hasSabaiCard: z.boolean(),
});

export type EditPatientFormValues = z.infer<typeof editPatientFormSchema>;
