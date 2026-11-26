import {
  toConsultFormValues,
  toConsultInput,
} from "@/lib/mappers/consult.mapper";
import {
  BLANK_CONSULT,
  ConsultFormValues,
  ConsultWithDiagnoses,
} from "@/types/consults";

const savedConsult = (
  overrides: Partial<ConsultWithDiagnoses> = {},
): ConsultWithDiagnoses =>
  ({
    id: 7,
    pastMedicalHistory: "Asthma",
    consultation: null,
    treatmentPlan: "Rest",
    remarks: null,
    diagnoses: [{ details: "Wheeze", category: "Respiratory" }],
    ...overrides,
  }) as ConsultWithDiagnoses;

describe("toConsultFormValues", () => {
  it("maps null text fields to empty strings", () => {
    const values = toConsultFormValues(savedConsult());
    expect(values.pastMedicalHistory).toBe("Asthma");
    expect(values.consultation).toBe("");
    expect(values.treatmentPlan).toBe("Rest");
    expect(values.remarks).toBe("");
    expect(values.diagnoses).toEqual([
      { details: "Wheeze", category: "Respiratory" },
    ]);
  });

  it("gives a consult without diagnoses one blank diagnosis row", () => {
    expect(
      toConsultFormValues(savedConsult({ diagnoses: [] })).diagnoses,
    ).toEqual([{ details: "", category: "" }]);
  });

  it("resets referral and orders to their blank defaults", () => {
    const values = toConsultFormValues(savedConsult());
    expect(values.referredFor).toBe("Not Referred");
    expect(values.referralNotes).toBe("");
    expect(values.orders).toEqual([]);
  });
});

describe("toConsultInput", () => {
  const formValues: ConsultFormValues = {
    ...BLANK_CONSULT,
    pastMedicalHistory: "Asthma",
    diagnoses: [{ details: "Wheeze", category: "Respiratory" }],
    referredFor: "Acute",
    referralNotes: "urgent",
    orders: [
      {
        activeIngredientId: "1",
        activeIngredientName: "Paracetamol",
        quantity: 1,
        dosageInstructions: "TDS",
      },
    ],
  };

  it("keeps only the consult fields", () => {
    expect(toConsultInput(formValues)).toEqual({
      pastMedicalHistory: "Asthma",
      consultation: "",
      treatmentPlan: "",
      remarks: "",
      diagnoses: [{ details: "Wheeze", category: "Respiratory" }],
    });
  });
});
