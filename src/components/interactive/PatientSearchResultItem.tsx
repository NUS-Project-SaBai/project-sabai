import Link from "next/link";
import { Patient } from "@/db/schema";
import { calculateAge, getInitials } from "@/lib/utils/patient";

interface PatientSearchResultItemProps {
  patient: Patient;
  onSelect: () => void;
}

export default function PatientSearchResultItem({
  patient,
  onSelect,
}: PatientSearchResultItemProps) {
  return (
    <Link
      href={`/patient/${patient.id}`}
      onClick={onSelect}
      className="flex items-center gap-3 text-sm text-neutral-700 px-2 py-2 rounded bg-white border border-neutral-100 hover:bg-neutral-75"
    >
      <div className="h-9 w-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-medium text-neutral-600 shrink-0">
        {getInitials(patient.name)}
      </div>
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
