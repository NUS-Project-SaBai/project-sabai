import { useState } from "react";
import { Button } from "@/components/interactive/Button/Button";
import Modal from "@/components/interactive/Modal";
import LoadingSpinner from "@/components/LoadingSpinner";
import EditPatientForm from "@/components/patient/EditPatientForm";
import { trpc, type RouterOutput } from "@/utils/trpc";

type Patient = NonNullable<RouterOutput["patientsRouter"]["getById"]>;

type EditPatientDetailsButtonProps = {
  /** Runs after the patient is saved, e.g. to refresh queries that also show
   * patient details. */
  onSaved?: () => void;
} & (
  | {
      /** The patient to edit, for pages that have already loaded it. */
      patient: Patient;
      patientId?: never;
    }
  | {
      /** The id of the patient to edit, for pages that only have the id. The
       * patient is fetched when the modal opens. */
      patientId: number;
      patient?: never;
    }
);

/**
 * "Edit Patient Details" button that opens `EditPatientForm` in a modal.
 * Pass `patient` when the page already has it, so it is not fetched again, or
 * `patientId` to fetch the patient when the modal opens.
 */
export function EditPatientDetailsButton({
  patient: givenPatient,
  patientId,
  onSaved,
}: EditPatientDetailsButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const shouldFetch = patientId !== undefined;
  const { data: fetchedPatient, isLoading } =
    trpc.patientsRouter.getById.useQuery(
      { id: patientId ?? 0 },
      { enabled: isEditing && shouldFetch },
    );
  const patient = givenPatient ?? fetchedPatient;

  function renderForm() {
    if (shouldFetch && isLoading) {
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
