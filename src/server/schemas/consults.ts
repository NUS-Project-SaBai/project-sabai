import { z } from "zod";
import { DIAGNOSIS_CATEGORIES } from "@/lib/constants/diagnosisCategories";

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
