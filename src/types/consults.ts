import { z } from "zod";
import { consultFormSchema } from "@/server/schemas/consults";

export type DiagnosisFormValue = {
  details: string;
  category: string;
};

export type OrderFormValue = {
  quantity: number;
  dosageInstructions: string;
  activeIngredientId: string;
  activeIngredientName: string; // only so that the pending order list has name it
};

export type ConsultFormValues = z.infer<typeof consultFormSchema> & {
  orders: OrderFormValue[];
};

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
