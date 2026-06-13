import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/utils/trpc";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { Mode } from "@/pages/scanFace";
import { useVillageCode } from "@/lib/context/VillageCodeContext";
import clsx from "clsx";

export type PatientForm = {
  name: string;
  identificationNumber: string;
  contactNo: string;
  gender: "male" | "female";
  drugAllergy: string;
  dateOfBirth: Date;
  hasPoorCard: boolean;
  hasBS2Card: boolean;
  hasSabaiCard: boolean;
};

export default function RegistrationPage({
  imgDetails,
  setImgDetails,
  setMode,
}: {
  imgDetails: string | null;
  setImgDetails: React.Dispatch<React.SetStateAction<string | null>>;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<PatientForm>();

  const createMutation = trpc.patientsRouter.create.useMutation();

  const { selectedVillageCodeId } = useVillageCode();
  const handleSubmit = async (data: PatientForm) => {
    setIsSubmitting(true);

    if (!imgDetails) {
      toast.error("Please capture a face image before submitting.");
      setIsSubmitting(false);
      return;
    }

    if (!selectedVillageCodeId) {
      toast.error("Please select a village code before submitting.");
      setIsSubmitting(false);
      return;
    }

    const toMutate: PatientForm & {
      patientImage: string;
      villageCodeId: number;
    } = {
      ...data,
      patientImage: imgDetails,
      villageCodeId: selectedVillageCodeId,
    };

    createMutation.mutate(toMutate, {
      onSuccess() {
        setIsSubmitting(false);
        toast.success("Patient created successfully!");
        setImgDetails(null);
        form.reset();
      },
      onError(error) {
        setIsSubmitting(false);
        console.error("Error creating patient:", error);
        toast.error("Failed to create patient. Please try again.");
      },
    });
  };

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
              className={clsx(
                "flex-1 px-4 py-2 rounded-lg font-medium text-white",
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700",
              )}
            >
              Create New Patient
            </button>
          </div>
        </form>
      </FormProvider>
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setMode(Mode.MATCHING)}
          className="flex-1 px-4 py-2 rounded-lg font-medium bg-indigo-700 text-white"
        >
          Match Instead
        </button>
      </div>
    </>
  );
}
