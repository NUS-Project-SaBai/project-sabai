import type { DiagnosisCategory } from "@/lib/constants/consults";
import type { CreateConsultInput } from "@/server/schemas/consults";
import {
  BLANK_CONSULT,
  ConsultFormValues,
  ConsultWithDiagnoses,
} from "@/types/consults";

/**
 * Maps between the consult DTOs returned and accepted by `consultsRouter` and
 * the consult form's view model. Pure shape conversion only: validation and
 * normalisation (trimming, blank text to NULL) belong to the server schemas.
 */

/**
 * DTO → view model. Loads a saved consult into the form: null text fields
 * become "", a consult without diagnoses gets one blank row, and orders and
 * referrals start blank because they are not editable.
 */
export function toConsultFormValues(
  dto: ConsultWithDiagnoses,
): ConsultFormValues {
  return {
    ...BLANK_CONSULT,
    pastMedicalHistory: dto.pastMedicalHistory ?? "",
    consultation: dto.consultation ?? "",
    treatmentPlan: dto.treatmentPlan ?? "",
    remarks: dto.remarks ?? "",
    diagnoses:
      dto.diagnoses.length > 0
        ? dto.diagnoses.map((d) => ({
            details: d.details,
            category: d.category ?? "",
          }))
        : BLANK_CONSULT.diagnoses,
  };
}

/**
 * View model → DTO. The consult fields of the form, shared by create (add
 * `visitId`) and update (add `id`). Referral and order fields are left out;
 * they are sent to their own routers.
 */
export function toConsultInput(
  values: ConsultFormValues,
): Omit<CreateConsultInput, "visitId"> {
  return {
    pastMedicalHistory: values.pastMedicalHistory,
    consultation: values.consultation,
    treatmentPlan: values.treatmentPlan,
    remarks: values.remarks,
    // consultFormSchema has already rejected blank categories.
    diagnoses: values.diagnoses.map((d) => ({
      details: d.details,
      category: d.category as DiagnosisCategory,
    })),
  };
}
