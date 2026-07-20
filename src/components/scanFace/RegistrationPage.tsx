import { useForm, FormProvider } from "react-hook-form";
import toast from "react-hot-toast";
import { trpc } from "@/utils/trpc";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { Mode } from "@/types/scan";
import { useVillageCode } from "@/lib/context/VillageCodeContext";
import { Button } from "@/components/interactive/Button/Button";

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
  const form = useForm<PatientForm>();

  const createMutation = trpc.patientsRouter.create.useMutation();

  const { selectedVillageCodeId } = useVillageCode();
  const handleSubmit = async (data: PatientForm) => {
    if (!imgDetails) {
      toast.error("Please capture a face image before submitting.");
      return;
    }

    if (!selectedVillageCodeId) {
      toast.error("Please select a village code before submitting.");
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
        toast.success("Patient created successfully!");
        setImgDetails(null);
        form.reset();
      },
      onError(error) {
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
          <div className="flex gap-3 mt-6 justify-center">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              colour="emerald"
              title={
                createMutation.isPending
                  ? "Creating new patient..."
                  : "Create New Patient"
              }
            />
          </div>
        </form>
      </FormProvider>
      <div className="flex gap-3 mt-6 justify-center">
        <Button
          onClick={() => setMode(Mode.MATCHING)}
          colour="indigo"
          title="Match Instead"
        />
      </div>
    </>
  );
}
