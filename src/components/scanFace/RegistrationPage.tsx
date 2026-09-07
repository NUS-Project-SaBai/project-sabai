import { useForm, FormProvider } from "react-hook-form";
import toast from "react-hot-toast";
import { trpc } from "@/utils/trpc";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";
import { Mode } from "@/types/scan";
import { useVillageCode } from "@/lib/context/VillageCodeContext";
import { Button } from "@/components/interactive/Button/Button";
import { calculateAge } from "@/lib/utils/patient";
import {
  PEDIATRIC_AGE_THRESHOLD,
  SCOLIOSIS_OPTIONS,
  PALLOR_OPTIONS,
  PUBARCHE_OPTIONS,
} from "./constants";

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
  scoliosis?: "normal" | "abnormal";
  pallor?: "yes" | "no";
  pubarche?: "yes" | "no";
  pubarcheAge?: string;
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

  const dobValue = form.watch("dateOfBirth");
  const pubarcheValue = form.watch("pubarche");
  // Use "T00:00:00" to parse as local time — plain "YYYY-MM-DD" is parsed as
  // UTC midnight, which produces wrong age near the 18th-birthday boundary for
  // users west of UTC.
  const isPediatric = dobValue
    ? calculateAge(new Date((dobValue as unknown as string) + "T00:00:00")) <
      PEDIATRIC_AGE_THRESHOLD
    : false;

  const handleSubmit = async (data: PatientForm) => {
    if (!imgDetails) {
      toast.error("Please capture a face image before submitting.");
      return;
    }

    if (!selectedVillageCodeId) {
      toast.error("Please select a village code before submitting.");
      return;
    }

    createMutation.mutate(
      {
        name: data.name,
        identificationNumber: data.identificationNumber,
        contactNo: data.contactNo,
        gender: data.gender,
        drugAllergy: data.drugAllergy,
        dateOfBirth: data.dateOfBirth,
        hasPoorCard: data.hasPoorCard,
        hasBS2Card: data.hasBS2Card,
        hasSabaiCard: data.hasSabaiCard,
        patientImage: imgDetails,
        villageCodeId: selectedVillageCodeId,
        ...(isPediatric && {
          scoliosis: data.scoliosis,
          pallor: data.pallor !== undefined ? data.pallor === "yes" : undefined,
          pubarche:
            data.pubarche !== undefined ? data.pubarche === "yes" : undefined,
          pubarcheAge: data.pubarcheAge
            ? parseInt(data.pubarcheAge, 10)
            : undefined,
        }),
      },
      {
        onSuccess() {
          toast.success("Patient created successfully!");
          setImgDetails(null);
          form.reset();
        },
        onError(error) {
          console.error("Error creating patient:", error);
          toast.error("Failed to create patient. Please try again.");
        },
      },
    );
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
          {isPediatric && (
            <div className="rounded-lg border border-gray-200 p-4 space-y-4">
              <p className="text-sm font-semibold">Child Vitals</p>
              <RHFDropdown
                name="scoliosis"
                label="Scoliosis"
                dropdownOptions={SCOLIOSIS_OPTIONS}
              />
              <RHFDropdown
                name="pallor"
                label="Pallor"
                dropdownOptions={PALLOR_OPTIONS}
              />
              <RHFDropdown
                name="pubarche"
                label="Pubarche"
                dropdownOptions={PUBARCHE_OPTIONS}
              />
              {pubarcheValue === "yes" && (
                <RHFInput
                  name="pubarcheAge"
                  label="Pubarche Age"
                  type="number"
                  min={1}
                />
              )}
            </div>
          )}
          <div className="rounded-lg border border-gray-200 bg-gray-50 divide-y divide-gray-200">
            <RHFInput
              name="hasPoorCard"
              label="Has POOR Card?"
              type="checkbox"
            />
            <RHFInput name="hasBS2Card" label="Has BS2 Card?" type="checkbox" />
            <RHFInput
              name="hasSabaiCard"
              label="Has Sabai Card?"
              type="checkbox"
            />
          </div>

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
