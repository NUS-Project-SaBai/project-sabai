/* 
THIS PAGE WAS WRITTEN TO TEST THE CLOUDINARY UPLOAD FUNCTIONALITY. 
IT IS NOT MEANT TO BE PRODUCTION-READY AND MAY CONTAIN SIMPLIFICATIONS OR HARDCODED VALUES FOR TESTING PURPOSES.

TO BE REFACTORED LATER:
- Form handling can be improved with react-hook-form
- Error handling and user feedback are minimal and should be enhanced for a better UX.
- The page currently does not handle optional fields or validation beyond basic HTML5 constraints.
*/

import { WebcamInput } from "@/lib/components/webcam_input";
import { withSession } from "@/lib/session";
import { trpc } from "@/utils/trpc";
import { useState } from "react";

type PatientForm = {
  name: string;
  identificationNumber: string;
  contactNo: string;
  gender: "male" | "female";
  drugAllergy: string;
  dateOfBirth: Date;
  poor: "yes" | "no";
  bs2: "yes" | "no";
  sabaiCard: "yes" | "no";
  patientImage: File;
};

function ScanFacePage() {
  const [cameraIsOpen, setCameraIsOpen] = useState(false);
  const [imgDetails, setImgDetails] = useState<string | null>(null);

  const DEFAULT_FORM: PatientForm = {
    name: "",
    identificationNumber: "",
    contactNo: "",
    gender: "male",
    drugAllergy: "",
    dateOfBirth: new Date(),
    poor: "no",
    bs2: "no",
    sabaiCard: "no",
    patientImage: new File([], ""), // Initialize with an empty File object
  };
  const [patientFormData, setPatientFormData] =
    useState<PatientForm>(DEFAULT_FORM);

  const createMutation = trpc.patientsRouter.create.useMutation();

  function urlToFile(url: string, filename: string, mimeType: string) {
    return fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buf) => new File([buf], filename, { type: mimeType }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // ← move this to the top

    if (!imgDetails) {
      alert("Please capture a face image before submitting.");
      return;
    }

    const patientImage = await urlToFile(
      imgDetails,
      `${patientFormData.name}.jpg`,
      "image/jpeg",
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
    formData.append("poor", patientFormData.poor);
    formData.append("bs2", patientFormData.bs2);
    formData.append("sabaiCard", patientFormData.sabaiCard);
    formData.append("patientImage", patientImage); // ← File goes in last

    createMutation.mutate(formData, {
      onSuccess() {
        alert("Patient created successfully!");
        setPatientFormData(DEFAULT_FORM);
        setImgDetails(null);
      },
      onError(error) {
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              required
              value={patientFormData.name}
              onChange={(e) =>
                setPatientFormData({ ...patientFormData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Marcus Darcus"
            />
          </div>

          {/* Identification Number Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Identification Number
            </label>
            <input
              value={patientFormData.identificationNumber}
              onChange={(e) =>
                setPatientFormData({
                  ...patientFormData,
                  identificationNumber: e.target.value,
                })
              }
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>

          {/* Contact Number Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Contact Number
            </label>
            <input
              value={patientFormData.contactNo}
              onChange={(e) =>
                setPatientFormData({
                  ...patientFormData,
                  contactNo: e.target.value,
                })
              }
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>

          {/* Gender Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Gender
            </label>
            <select
              required
              value={patientFormData.gender}
              onChange={(e) => {
                const value = e.target.value;
                if (value !== "male" && value !== "female") {
                  return;
                }
                setPatientFormData({ ...patientFormData, gender: value });
              }}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Drug Allergy Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Drug Allergy
            </label>
            <input
              value={patientFormData.drugAllergy}
              onChange={(e) =>
                setPatientFormData({
                  ...patientFormData,
                  drugAllergy: e.target.value,
                })
              }
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>

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
                checked={patientFormData.poor === "yes"}
                onChange={(e) =>
                  setPatientFormData({
                    ...patientFormData,
                    poor: e.target.checked ? "yes" : "no",
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
                checked={patientFormData.bs2 === "yes"}
                onChange={(e) =>
                  setPatientFormData({
                    ...patientFormData,
                    bs2: e.target.checked ? "yes" : "no",
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
                checked={patientFormData.sabaiCard === "yes"}
                onChange={(e) =>
                  setPatientFormData({
                    ...patientFormData,
                    sabaiCard: e.target.checked ? "yes" : "no",
                  })
                }
                className="rounded border-slate-300"
              />
              Has Sabai Card?
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 hover:cursor-pointer"
            >
              Create New Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withSession(ScanFacePage);
