import FormSection from "@/components/interactive/inputs/FormSection";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";

/**
 * **Important:** Must be rendered inside a `FormProvider` whose values include
 * `DentalScalarFormValues`.
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
