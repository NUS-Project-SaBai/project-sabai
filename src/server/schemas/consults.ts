import { z } from "zod";
import { DIAGNOSIS_CATEGORIES } from "@/lib/constants/consults";
import { REFERRAL_CATEGORIES } from "@/lib/constants/referralCategories";

const consultTextSchema = z.string().trim();

// Blank text is stored as NULL. Always sending a value means an update can clear it.
const consultTextInput = consultTextSchema
  .nullish()
  .transform((value) => value || null);

const diagnosisDetailsSchema = z
  .string()
  .trim()
  .min(1, "Diagnosis details are required");

export const diagnosisInput = z.object({
  details: diagnosisDetailsSchema,
  category: z.enum(DIAGNOSIS_CATEGORIES),
});

// Form variant: category is z.string() so "" is a valid blank default.
// The server re-validates with z.enum() before any DB write.
export const consultFormSchema = z.object({
  pastMedicalHistory: consultTextSchema,
  consultation: consultTextSchema,
  treatmentPlan: consultTextSchema,
  remarks: consultTextSchema,
  diagnoses: z.array(
    z.object({
      details: diagnosisDetailsSchema,
      category: z.string().min(1, "Please select a category"),
    }),
  ),
  referredFor: z.enum(REFERRAL_CATEGORIES),
  referralNotes: z.string().optional(),
  // Pending orders are validated in OrderModal and again by the orders router on submit.
  orders: z.array(
    z.object({
      quantity: z.number().int().positive(),
      dosageInstructions: z.string(),
      activeIngredientId: z.string(),
      activeIngredientName: z.string(), // only so that the pending order list has name it
    }),
  ),
});

export const createConsultInput = z.object({
  visitId: z.number().int().positive(),
  pastMedicalHistory: consultTextInput,
  consultation: consultTextInput,
  treatmentPlan: consultTextInput,
  remarks: consultTextInput,
  diagnoses: z
    .array(diagnosisInput)
    .min(1, "At least one diagnosis is required"),
});

export const updateConsultInput = createConsultInput
  .omit({ visitId: true })
  .extend({ id: z.number().int().positive() });

export type CreateConsultInput = z.input<typeof createConsultInput>;
export type UpdateConsultInput = z.input<typeof updateConsultInput>;
