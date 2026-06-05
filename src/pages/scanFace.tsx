/* 
THIS PAGE WAS WRITTEN TO TEST THE CLOUDINARY UPLOAD FUNCTIONALITY. 
IT IS NOT MEANT TO BE PRODUCTION-READY AND MAY CONTAIN SIMPLIFICATIONS OR HARDCODED VALUES FOR TESTING PURPOSES.

TO BE REFACTORED LATER:
- Form handling can be improved with react-hook-form
- Error handling and user feedback are minimal and should be enhanced for a better UX.
- The page currently does not handle optional fields or validation beyond basic HTML5 constraints.
*/

import { WebcamInput } from "@/components/interactive/inputs/WebcamInput";
import { trpc } from "@/utils/trpc";
import { useState } from "react";

import { FormProvider, useForm, SubmitHandler } from "react-hook-form";
import { RHFInput } from "@/components/interactive/RHF/RHFInput";
import { RHFDropdown } from "@/components/interactive/RHF/RHFDropdown";

type PatientForm = {
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

type PatientFormWithImage = PatientForm & {
  patientImage: string;
};

function ScanFacePage() {
  const [, setCameraIsOpen] = useState(false);
  const [imgDetails, setImgDetails] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<PatientForm>();

  const createMutation = trpc.patientsRouter.create.useMutation();

  const handleSubmit = async (data: PatientFormWithImage) => {
    setIsSubmitting(true);

    if (!imgDetails) {
      alert("Please capture a face image before submitting.");
      setIsSubmitting(false);
      return;
    }

    const toMutate: PatientFormWithImage = {
      ...data,
      dateOfBirth: data.dateOfBirth,
      patientImage: imgDetails,
    };

    createMutation.mutate(toMutate, {
      onSuccess() {
        setIsSubmitting(false);
        alert("Patient created successfully!");
        setImgDetails(null);
      },
      onError(error) {
        setIsSubmitting(false);
        console.error("Error creating patient:", error);
        alert("Failed to create patient. Please try again.");
      },
    });
  };

  const cameraToggleCallback = (isOpen: boolean) => {
    setCameraIsOpen(isOpen);
  };

  function setScannedFace(picture: string | null) {
    setImgDetails(picture);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">Scan Face</h1>
        <div className="flex flex-col space-y-2">
          <WebcamInput
            imageDetails={imgDetails}
            setImageDetails={setScannedFace}
            cameraIsOpenCallback={cameraToggleCallback}
            width={500}
            height={500}
          />
        </div>
        {/* Create Patient Form */}
        <FormProvider {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(handleSubmit)(e);
            }}
            className="space-y-4"
          >
            <RHFInput name="name" label="Name" type="text" />
            <RHFInput
              name="identificationNumber"
              label="Identification Number"
              type="text"
            />
            <RHFInput name="contactNo" label="Contact Number" type="text" />
            <RHFDropdown
              name="gender"
              label="Gender"
              dropdownOptions={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
              ]}
            />
            <RHFInput name="drugAllergy" label="Drug Allergy" type="text" />
            <RHFInput name="dateOfBirth" label="Date of Birth" type="date" />
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
      </div>
    </div>
  );
}

export default ScanFacePage;
