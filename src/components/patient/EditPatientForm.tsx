import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import { WebcamInput } from "@/components/interactive/inputs/WebcamInput";
import toast from "react-hot-toast";
import { trpc, RouterOutput } from "@/utils/trpc";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { Button } from "@/components/interactive/Button/Button";
import { toDateInputValue } from "@/lib/utils/patient";

type Patient = NonNullable<RouterOutput["patientsRouter"]["getById"]>;

type EditPatientFormValues = {
  name: string;
  identificationNumber: string;
  contactNo: string;
  gender: "male" | "female";
  drugAllergy: string;
  dateOfBirth: string;
  hasPoorCard: boolean;
  hasBS2Card: boolean;
  hasSabaiCard: boolean;
};

/**
 * Reusable form for editing an existing patient's  details. Prefills
 * from the given patient and persists via `patientsRouter.update`. Supports
 * re-capturing the patient's photo; the new image is only sent when the user
 * actually retakes it, otherwise the existing photo is left untouched.
 */
export default function EditPatientForm({
  patient,
  onSuccess,
}: {
  patient: Patient;
  onSuccess?: () => void;
}) {
  const form = useForm<EditPatientFormValues>({
    defaultValues: {
      name: patient.name,
      identificationNumber: patient.identificationNumber ?? "",
      contactNo: patient.contactNo ?? "",
      gender: patient.gender,
      drugAllergy: patient.drugAllergy,
      // <input type="date"> only accepts a yyyy-MM-dd value; patient.dateOfBirth
      // arrives as a Date/ISO string, so convert it or the field renders blank.
      dateOfBirth: toDateInputValue(patient.dateOfBirth),
      hasPoorCard: patient.hasPoorCard,
      hasBS2Card: patient.hasBS2Card,
      hasSabaiCard: patient.hasSabaiCard,
    },
  });

  const [imageDetails, setImageDetails] = useState<string | null>(
    patient.patientImageUrl,
  );

  const utils = trpc.useUtils();
  const updateMutation = trpc.patientsRouter.update.useMutation();

  const handleSubmit = (data: EditPatientFormValues) => {
    // A freshly captured photo is a base64 data URL; the prefilled value is a
    // remote Cloudinary URL. Only send patientImage when it's a new capture.
    const isNewPhoto = imageDetails?.startsWith("data:") ?? false;

    updateMutation.mutate(
      {
        id: patient.id,
        ...data,
        ...(isNewPhoto ? { patientImage: imageDetails! } : {}),
      },
      {
        onSuccess() {
          utils.patientsRouter.getById.invalidate({ id: patient.id });
          toast.success("Patient details updated successfully!");
          onSuccess?.();
        },
        onError(error) {
          console.error("Error updating patient:", error);
          toast.error("Failed to update patient. Please try again.");
        },
      },
    );
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit(handleSubmit)(e);
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-6">
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
        </div>
        <WebcamInput
          imageDetails={imageDetails}
          setImageDetails={setImageDetails}
        />

        <div className="flex gap-3 mt-6 justify-center">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            colour="emerald"
            title={updateMutation.isPending ? "Saving..." : "Save Changes"}
          />
        </div>
      </form>
    </FormProvider>
  );
}
