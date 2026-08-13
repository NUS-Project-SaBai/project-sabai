import { z } from "zod";
import { consultFormSchema } from "@/server/schemas/consults";

export type DiagnosisFormValue = {
  details: string;
  category: string;
};

export type Medicine = {
  activeIngredientName: string;
  unitOfMeasurement: string;
  quantity: number;
};

export type OrderFormValue = {
  quantity: number;
  dosageInstructions: string;
  medicine: Medicine;
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
