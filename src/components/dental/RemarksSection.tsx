import FormSection from "@/components/interactive/inputs/FormSection";
import { RHFTextArea } from "@/components/interactive/RHF/RHFTextArea";

/**
 * **Important:** Must be rendered inside a `FormProvider` whose values include
 * `DentalScalarFormValues`.
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
