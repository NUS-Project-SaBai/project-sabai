import { Patient } from "@/db/schema";
import PatientSearchResultItem from "@/components/interactive/PatientSearchResultItem";
import useDebounce from "@/hooks/useDebounce";

interface PatientSearchResultsProps {
  searchText: string;
  filteredPatients: Patient[];
  isLoading: boolean;
  isRefetching: boolean;
  onSelect: () => void;
}

export default function PatientSearchResults({
  searchText,
  filteredPatients,
  isLoading,
  isRefetching,
  onSelect,
}: PatientSearchResultsProps) {
  const debouncedSearchText = useDebounce(searchText, 300);
  if (debouncedSearchText.trim() === "") {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 px-2 py-1 bg-neutral-50 border border-neutral-100 rounded-md shadow-lg">
      {isLoading || isRefetching ? (
        <p className="text-sm text-neutral-500">Loading patients...</p>
      ) : filteredPatients.length === 0 ? (
        <p className="text-sm text-neutral-500">No matching patients found.</p>
      ) : (
        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
          {filteredPatients.map((patient) => (
            <PatientSearchResultItem
              key={patient.id}
              patient={patient}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
