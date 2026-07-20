import Link from "next/link";
import { calculateAge } from "@/lib/utils/patient";
import { PatientPhoto } from "@/components/PatientPhoto";
import { PatientsRouterListItem } from "@/utils/trpc-types";

interface PatientSearchResultItemProps {
  patient: PatientsRouterListItem;
  onSelect: () => void;
  linkPath?: string;
}

export default function PatientSearchResultItem({
  patient,
  onSelect,
  linkPath = `/patient/${patient.id}`,
}: PatientSearchResultItemProps) {
  return (
    <Link
      href={linkPath}
      onClick={onSelect}
      className="flex items-center gap-3 text-sm text-neutral-700 px-2 py-2 rounded bg-white border border-neutral-100 hover:bg-neutral-75"
    >
      <PatientPhoto
        pictureUrl={patient.patientImageUrl}
        height={40}
        width={40}
        className="rounded-full border border-slate-200"
      />
      <div className="flex min-w-0 flex-col">
        <span className="font-medium truncate">{patient.name}</span>
        <span className="text-xs text-neutral-500">
          ID: {patient.id} • {calculateAge(patient.dateOfBirth)} yrs •{" "}
          {patient.gender}
        </span>
      </div>
    </Link>
  );
}
