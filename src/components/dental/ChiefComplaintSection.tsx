import type { Dental } from "@/db/schema/dental";
import FormSection from "@/components/interactive/inputs/FormSection";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";

export type ChiefComplaintFormValues = {
  chiefComplaint: string;
};

export const chiefComplaintDefaultValues: ChiefComplaintFormValues = {
  chiefComplaint: "",
};

type ChiefComplaintRecord = Pick<Dental, keyof ChiefComplaintFormValues>;

/** Maps a saved record (or none) to form values; `null` becomes "". */
export function toChiefComplaintFormValues(
  record: ChiefComplaintRecord | null,
): ChiefComplaintFormValues {
  if (!record) return chiefComplaintDefaultValues;
  return { chiefComplaint: record.chiefComplaint ?? "" };
}

/**
 * Maps form values to the router payload. A blank complaint is sent as `null`
 * (not `undefined`) so clearing it actually clears it on update.
 */
export function toChiefComplaintPayload(values: ChiefComplaintFormValues) {
  return { chiefComplaint: values.chiefComplaint.trim() || null };
}

/**
 * **Important:** Must be rendered inside a `FormProvider` whose values include
 * `ChiefComplaintFormValues`.
 */
export function ChiefComplaintSection() {
  return (
    <FormSection
      title="Chief Complaint"
      description="The patient's main reason for visiting the dental station."
    >
      <RHFInput
        name="chiefComplaint"
        label="Chief complaint"
        type="text"
        placeholder="What brings the patient to the dental station?"
        maxLength={255}
      />
    </FormSection>
  );
}
