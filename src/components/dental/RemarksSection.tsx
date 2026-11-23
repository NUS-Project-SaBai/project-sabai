import type { Dental } from "@/db/schema/dental";
import FormSection from "@/components/interactive/inputs/FormSection";
import { RHFTextArea } from "@/components/interactive/RHF/RHFTextArea";

export type RemarksFormValues = {
  remarks: string;
};

export const remarksDefaultValues: RemarksFormValues = {
  remarks: "",
};

type RemarksRecord = Pick<Dental, keyof RemarksFormValues>;

/** Maps a saved record (or none) to form values; `null` becomes "". */
export function toRemarksFormValues(
  record: RemarksRecord | null,
): RemarksFormValues {
  if (!record) return remarksDefaultValues;
  return { remarks: record.remarks ?? "" };
}

/**
 * Maps form values to the router payload. Blank remarks are sent as `null`
 * (not `undefined`) so clearing them actually clears them on update.
 */
export function toRemarksPayload(values: RemarksFormValues) {
  return { remarks: values.remarks.trim() || null };
}

/**
 * **Important:** Must be rendered inside a `FormProvider` whose values include
 * `RemarksFormValues`.
 */
export function RemarksSection() {
  return (
    <FormSection title="Remarks">
      <RHFTextArea
        name="remarks"
        label="Remarks"
        rows={4}
        placeholder="Additional notes..."
        maxLength={255}
      />
    </FormSection>
  );
}
