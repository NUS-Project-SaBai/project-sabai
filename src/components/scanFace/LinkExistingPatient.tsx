import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import SearchInput from "@/components/interactive/inputs/SearchInput";
import { Button } from "@/components/interactive/Button/Button";
import { PatientPhoto } from "@/components/PatientPhoto";
import Modal from "@/components/interactive/Modal";
import { trpc } from "@/utils/trpc";
import { Mode } from "@/types/scan";
import { useVillageCode } from "@/lib/context/VillageCodeContext";
import useDebounce from "@/hooks/useDebounce";
import { formatPatientId } from "@/lib/utils/patient";
import { PatientsRouterListItem } from "@/utils/trpc-types";

function patientMatchesSearch(
  patient: PatientsRouterListItem,
  searchText: string,
) {
  const normalized = searchText.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const identificationNumber =
    patient.identificationNumber?.toLowerCase() ?? "";

  return (
    patient.name.toLowerCase().includes(normalized) ||
    patient.id.toString().includes(normalized) ||
    formatPatientId(patient.id).toLowerCase().includes(normalized) ||
    identificationNumber.includes(normalized)
  );
}

export default function LinkExistingPatient({
  imgDetails,
  setImgDetails,
  setMode,
}: {
  imgDetails: string;
  setImgDetails: React.Dispatch<React.SetStateAction<string | null>>;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
}) {
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300);
  const [duplicateVisitConfirmation, setDuplicateVisitConfirmation] = useState<{
    patientId: number;
    existingVisitDate: Date | null;
  } | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const { selectedVillageCodeId } = useVillageCode();
  const utils = trpc.useUtils();
  const {
    data: patients = [],
    isLoading,
    isError,
  } = trpc.patientsRouter.list.useQuery();
  const updateFaceMutation = trpc.patientsRouter.updateFace.useMutation();

  const isBusy = isCheckingDuplicate || updateFaceMutation.isPending;

  const filteredPatients = useMemo(() => {
    return patients
      .filter((patient) => patientMatchesSearch(patient, debouncedSearchText))
      .sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
  }, [patients, debouncedSearchText]);

  async function handleUpdateFace(patientId: number) {
    if (isCheckingDuplicate || updateFaceMutation.isPending) {
      return;
    }

    if (!selectedVillageCodeId) {
      toast.error("Please select a village code before submitting.");
      return;
    }

    setIsCheckingDuplicate(true);
    try {
      const { hasRecentVisit, existingVisitDate } =
        await utils.visitsRouter.hasRecentVisit.fetch({ patientId });
      if (hasRecentVisit) {
        setDuplicateVisitConfirmation({ patientId, existingVisitDate });
        return;
      }
    } catch {
      // The duplicate check is a guard, not a gate. Continue when it fails
      // so a network error does not block registration.
    } finally {
      setIsCheckingDuplicate(false);
    }

    submitUpdateFace(patientId);
  }

  function submitUpdateFace(patientId: number) {
    if (!selectedVillageCodeId || updateFaceMutation.isPending) {
      if (!selectedVillageCodeId) {
        toast.error("Please select a village code before submitting.");
      }
      return;
    }

    updateFaceMutation.mutate(
      {
        id: patientId,
        patientImage: imgDetails,
        villageCodeId: selectedVillageCodeId,
      },
      {
        onSuccess() {
          toast.success("Face updated and visit created successfully!");
          void utils.patientsRouter.list.invalidate();
          void utils.patientsRouter.listWithLatestVisit.invalidate();
          void utils.patientsRouter.getById.invalidate({ id: patientId });
          setDuplicateVisitConfirmation(null);
          setImgDetails(null);
          setMode(Mode.MATCHING);
        },
        onError(error) {
          console.error("Error updating patient face:", error);
          toast.error("Failed to update face. Please try again.");
        },
      },
    );
  }

  function renderResults() {
    const query = debouncedSearchText.trim();
    if (!query) {
      return null;
    }

    if (isLoading) {
      return <p className="mt-4 text-sm text-slate-500">Loading patients...</p>;
    }

    if (isError) {
      return (
        <p className="mt-4 text-sm text-red-600">
          Could not load patients. Please try again.
        </p>
      );
    }

    if (filteredPatients.length === 0) {
      return (
        <p className="mt-4 text-sm text-slate-500">
          No matching patients found.
        </p>
      );
    }

    return (
      <ul className="mt-4 flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
        {filteredPatients.map((patient) => (
          <li
            key={patient.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-3">
              <PatientPhoto
                pictureUrl={patient.patientImageUrl}
                height={48}
                width={48}
                className="rounded-lg border border-slate-200"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {patient.name}
                </p>
                <p className="text-xs text-slate-500">
                  {`ID: ${formatPatientId(patient.id)}${
                    patient.identificationNumber
                      ? ` • ${patient.identificationNumber}`
                      : ""
                  }`}
                </p>
              </div>
            </div>
            <Button
              colour="emerald"
              title={
                updateFaceMutation.isPending ? "Updating..." : "Update face"
              }
              disabled={isBusy}
              onClick={() => handleUpdateFace(patient.id)}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="mb-2 text-xl font-bold text-slate-900">
        Link existing patient
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Search by patient name or ID. Updating a face replaces their photo and
        creates a visit.
      </p>
      <div className="max-w-xl">
        <SearchInput
          searchText={searchText}
          setSearchText={setSearchText}
          placeholder="Search by name or ID"
          className="w-full"
          inputClassName="w-full px-3 py-2"
        />
      </div>
      {renderResults()}
      <div className="mt-6 flex gap-3">
        <Button
          colour="indigo"
          title="Match Instead"
          disabled={isBusy}
          onClick={() => setMode(Mode.MATCHING)}
        />
      </div>
      {duplicateVisitConfirmation !== null && (
        <Modal
          title="Duplicate Visit"
          onClose={() => {
            if (!updateFaceMutation.isPending) {
              setDuplicateVisitConfirmation(null);
            }
          }}
        >
          <p className="mb-6 text-slate-700">
            A visit already exists for this patient
            {duplicateVisitConfirmation.existingVisitDate && (
              <>
                {" "}
                at{" "}
                {duplicateVisitConfirmation.existingVisitDate.toLocaleTimeString()}
              </>
            )}
            . Updating their face will also create another visit. Are you sure?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              colour="red"
              title="Cancel"
              disabled={updateFaceMutation.isPending}
              onClick={() => setDuplicateVisitConfirmation(null)}
            />
            <Button
              colour="emerald"
              title={updateFaceMutation.isPending ? "Updating..." : "Confirm"}
              disabled={updateFaceMutation.isPending}
              onClick={() =>
                submitUpdateFace(duplicateVisitConfirmation.patientId)
              }
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
