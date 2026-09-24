import { z } from "zod";
import { DIAGNOSIS_CATEGORIES } from "@/lib/constants/diagnosisCategories";
import { REFERRAL_CATEGORIES } from "@/lib/constants/referralCategories";

export const diagnosisInput = z.object({
  details: z.string().trim().min(1, "Diagnosis details are required"),
  category: z.enum(DIAGNOSIS_CATEGORIES),
});

export const createConsultInput = z.object({
  visitId: z.number().int().positive(),
  pastMedicalHistory: z.string().trim().optional(),
  consultation: z.string().trim().optional(),
  treatmentPlan: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
  diagnoses: z
    .array(diagnosisInput)
    .min(1, "At least one diagnosis is required"),
});

export type CreateConsultInput = z.infer<typeof createConsultInput>;

// Form variant: relaxes category to z.string() so "" is a valid blank default.
// The server re-validates with z.enum() before any DB write.
export const consultFormSchema = createConsultInput
  .omit({ visitId: true })
  .extend({
    diagnoses: z.array(
      z.object({
        details: z.string().trim().min(1, "Diagnosis details are required"),
        category: z.string().min(1, "Please select a category"),
      }),
    ),
    referredFor: z.enum(REFERRAL_CATEGORIES).default("Not Referred"),
    referralNotes: z.string().optional(),
  });
