export type DiagnosisFormValue = {
  details: string;
  category: string;
};

export type Medicine = {
  activeIngredientName: string;
  brandName: string;
  unitOfMeasurement: string;
  quantity: number;
};

export type OrderFormValue = {
  quantity: number;
  dosageInstructions: string;
  medicine: Medicine;
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
