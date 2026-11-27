import { useState } from "react";
import { HiOutlineArrowUpTray, HiOutlineEye } from "react-icons/hi2";
import { Button } from "@/components/interactive/Button/Button";
import UploadDocumentsModal from "./UploadDocumentsModal";
import ViewDocumentsModal from "./ViewDocumentsModal";

/**
 * Upload Document and View Documents buttons for a patient. Self-contained so it can sit on
 * any page that shows a patient.
 */
export default function PatientDocuments({ patientId }: { patientId: number }) {
  const [openModal, setOpenModal] = useState<"upload" | "view" | null>(null);
  const closeModal = () => setOpenModal(null);

  return (
    // Equal-width column: full width on mobile, as wide as the widest button from sm up.
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <Button
        colour="emerald"
        title="Upload Document"
        icon={<HiOutlineArrowUpTray className="h-5 w-5" />}
        onClick={() => setOpenModal("upload")}
      />
      <Button
        colour="indigo"
        title="View Documents"
        icon={<HiOutlineEye className="h-5 w-5" />}
        onClick={() => setOpenModal("view")}
      />
      {openModal === "upload" && (
        <UploadDocumentsModal patientId={patientId} onClose={closeModal} />
      )}
      {openModal === "view" && (
        <ViewDocumentsModal patientId={patientId} onClose={closeModal} />
      )}
    </div>
  );
}
