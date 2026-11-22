import { z } from "zod";
import { consultFormSchema } from "@/server/schemas/consults";

export type ConsultFormValues = z.infer<typeof consultFormSchema>;

export type OrderFormValue = ConsultFormValues["orders"][number];

export const BLANK_CONSULT: ConsultFormValues = {
  pastMedicalHistory: "",
  consultation: "",
  treatmentPlan: "",
  remarks: "",
  diagnoses: [{ details: "", category: "" }],
  referredFor: "Not Referred",
  referralNotes: "",
  orders: [],
};
