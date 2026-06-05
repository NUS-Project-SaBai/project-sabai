import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { UseFormReturn, FormProvider } from "react-hook-form";
import { PatientForm } from "@/pages/scanFace";

export default function RegistrationForm({
  form,
  handleSubmit,
  isSubmitting,
}: {
  form: UseFormReturn<PatientForm>;
  handleSubmit: (data: PatientForm) => Promise<void>;
  isSubmitting: boolean;
}) {
  return (
    <>
      <FormProvider {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(handleSubmit)(e);
          }}
          className="space-y-4"
        >
          <RHFInput name="name" label="Name" type="text" isRequired />
          <RHFInput
            name="identificationNumber"
            label="Identification Number"
            type="text"
            isRequired
          />
          <RHFInput
            name="contactNo"
            label="Contact Number"
            type="text"
            isRequired
          />
          <RHFDropdown
            name="gender"
            label="Gender"
            dropdownOptions={[
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
            ]}
            isRequired
          />
          <RHFInput
            name="drugAllergy"
            label="Drug Allergy"
            type="text"
            isRequired
          />
          <RHFInput
            name="dateOfBirth"
            label="Date of Birth"
            type="date"
            isRequired
          />
          <RHFInput
            name="hasPoorCard"
            label="Has POOR Card?"
            type="checkbox"
            className="flex flex-row-reverse"
          />
          <RHFInput
            name="hasBS2Card"
            label="Has BS2 Card?"
            type="checkbox"
            className="flex flex-row-reverse"
          />
          <RHFInput
            name="hasSabaiCard"
            label="Has Sabai Card?"
            type="checkbox"
            className="flex flex-row-reverse"
          />

          {/* Submit Button */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg font-medium ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 hover:cursor-pointer"}`}
            >
              Create New Patient
            </button>
          </div>
        </form>
      </FormProvider>
    </>
  );
}
