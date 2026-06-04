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
import { toBytes } from "@/lib/utils/facialRecognition";
import { FormProvider, useForm, SubmitHandler } from 'react-hook-form';
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
  patientImage: File;
};

function ScanFacePage() {
  const [cameraIsOpen, setCameraIsOpen] = useState(false);
  const [imgDetails, setImgDetails] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const DEFAULT_FORM: PatientForm = {
    name: "",
    identificationNumber: "",
    contactNo: "",
    gender: "male",
    drugAllergy: "",
    dateOfBirth: new Date(),
    hasPoorCard: false,
    hasBS2Card: false,
    hasSabaiCard: false,
    patientImage: new File([], ""), // Initialize with an empty File object
  };
  const [patientFormData, setPatientFormData] =
    useState<PatientForm>(DEFAULT_FORM);

  const createMutation = trpc.patientsRouter.create.useMutation();

  function dataUrlToFile(dataUrl: string, filename: string): File {
    const [header, base64] = dataUrl.split(",");
    const mimeType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
    const bytes = toBytes(base64);
    return new File([bytes], filename, { type: mimeType });
  }

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault(); // ← move this to the top
    setIsSubmitting(true);

    if (!imgDetails) {
      alert("Please capture a face image before submitting.");
      setIsSubmitting(false);
      return;
    }

    const patientImage = dataUrlToFile(
      imgDetails,
      `${patientFormData.name}.jpg`,
    );

    // ✅ Build FormData instead of a plain object
    const formData = new FormData();
    formData.append("name", patientFormData.name);
    formData.append(
      "identificationNumber",
      patientFormData.identificationNumber,
    );
    formData.append("contactNo", patientFormData.contactNo);
    formData.append("gender", patientFormData.gender);
    formData.append("drugAllergy", patientFormData.drugAllergy);
    formData.append("dateOfBirth", patientFormData.dateOfBirth.toISOString());
    formData.append("hasPoorCard", patientFormData.hasPoorCard.toString());
    formData.append("hasBS2Card", patientFormData.hasBS2Card.toString());
    formData.append("hasSabaiCard", patientFormData.hasSabaiCard.toString());
    formData.append("patientImage", patientImage); // ← File goes in last

    createMutation.mutate(formData, {
      onSuccess() {
        setIsSubmitting(false);
        alert("Patient created successfully!");
        setPatientFormData(DEFAULT_FORM);
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

  const form = useForm();

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <RHFInput name="name" label="Name" type="text" />
            <RHFInput name="identificationNumber" label="Identification Number" type="text" />
            <RHFInput name="contactNo" label="Contact Number" type="text" />
            <RHFDropdown name="Gender" label="Gender" dropdownOptions={[{ label: "Male", value: "Male" }, { label: "Female", value: "Female" }]} />
            <RHFInput name="drugAllergy" label="Drug Allergy" type="text" />

            {/* Date of Birth Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Date of Birth
              </label>
              <input
                required
                type="date"
                value={patientFormData.dateOfBirth.toISOString().split("T")[0]}
                onChange={(e) =>
                  setPatientFormData({
                    ...patientFormData,
                    dateOfBirth: new Date(e.target.value),
                  })
                }
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>

            {/* POOR Card Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={patientFormData.hasPoorCard}
                  onChange={(e) =>
                    setPatientFormData({
                      ...patientFormData,
                      hasPoorCard: e.target.checked,
                    })
                  }
                  className="rounded border-slate-300"
                />
                Has POOR Card?
              </label>
            </div>

            {/* BS2 Card Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={patientFormData.hasBS2Card}
                  onChange={(e) =>
                    setPatientFormData({
                      ...patientFormData,
                      hasBS2Card: e.target.checked,
                    })
                  }
                  className="rounded border-slate-300"
                />
                Has BS2 Card?
              </label>
            </div>

            {/* Sabai Card Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={patientFormData.hasSabaiCard}
                  onChange={(e) =>
                    setPatientFormData({
                      ...patientFormData,
                      hasSabaiCard: e.target.checked,
                    })
                  }
                  className="rounded border-slate-300"
                />
                Has Sabai Card?
              </label>
            </div>

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
