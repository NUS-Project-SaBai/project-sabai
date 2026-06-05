/* 
THIS PAGE WAS WRITTEN TO TEST THE CLOUDINARY UPLOAD FUNCTIONALITY. 
IT IS NOT MEANT TO BE PRODUCTION-READY AND MAY CONTAIN SIMPLIFICATIONS OR HARDCODED VALUES FOR TESTING PURPOSES.

TO BE REFACTORED LATER:
- Error handling and user feedback are minimal and should be enhanced for a better UX.
- The page currently does not handle optional fields or validation beyond basic HTML5 constraints.
*/

import { WebcamInput } from "@/components/interactive/inputs/WebcamInput";
import RegistrationForm from "@/components/RegistrationForm";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { useForm } from "react-hook-form";

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

type PatientFormWithImage = PatientForm & {
  patientImage: string;
};

function ScanFacePage() {
  const [, setCameraIsOpen] = useState(false);
  const [imgDetails, setImgDetails] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<PatientForm>();

  const createMutation = trpc.patientsRouter.create.useMutation();

  const handleSubmit = async (data: PatientForm) => {
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
        form.reset();
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
        <RegistrationForm
          form={form}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}

export default ScanFacePage;
