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

export type ConsultFormValues = {
  pastMedicalHistory: string;
  consultation: string;
  treatmentPlan: string;
  remarks: string;
  diagnoses: DiagnosisFormValue[];
  orders: OrderFormValue[];
};

export const BLANK_CONSULT: ConsultFormValues = {
  pastMedicalHistory: "",
  consultation: "",
  treatmentPlan: "",
  remarks: "",
  diagnoses: [{ details: "", category: "" }],
  orders: [],
};
