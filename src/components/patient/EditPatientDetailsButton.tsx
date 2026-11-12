import { useState } from "react";
import { Button } from "@/components/interactive/Button/Button";
import Modal from "@/components/interactive/Modal";
import LoadingSpinner from "@/components/LoadingSpinner";
import EditPatientForm from "@/components/patient/EditPatientForm";
import { trpc } from "@/utils/trpc";

/**
 * "Edit Patient Details" button that opens `EditPatientForm` in a modal, as on
 * the vitals page. For pages that only have the patient's id: the full patient
 * is fetched when the modal opens.
 * @param patientId - The patient to edit.
 * @param onSaved - Runs after the patient is saved, e.g. to refresh queries
 * that also show patient details.
 */
export function EditPatientDetailsButton({
  patientId,
  onSaved,
}: {
  patientId: number;
  onSaved?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const { data: patient, isLoading } = trpc.patientsRouter.getById.useQuery(
    { id: patientId },
    { enabled: isEditing },
  );

  function renderForm() {
    if (isLoading) {
      return <LoadingSpinner message="Loading patient..." className="p-8" />;
    }
    if (!patient) {
      return (
        <p className="p-8 text-center font-semibold text-red-500">
          Patient not found
        </p>
      );
    }
    return (
      <EditPatientForm
        patient={patient}
        onSuccess={() => {
          setIsEditing(false);
          onSaved?.();
        }}
      />
    );
  }

  return (
    <>
      <Button
        title="Edit Patient Details"
        colour="indigo"
        onClick={() => setIsEditing(true)}
        className="shrink-0"
      />
      {isEditing && (
        <Modal
          title="Edit Patient Details"
          onClose={() => setIsEditing(false)}
          maxWidthClassName="max-w-2xl"
        >
          {renderForm()}
        </Modal>
      )}
    </>
  );
}
