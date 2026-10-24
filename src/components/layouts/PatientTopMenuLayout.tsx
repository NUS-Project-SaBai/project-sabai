import { ReactNode, useMemo, useState } from "react";
import SearchInput from "@/components/interactive/inputs/SearchInput";
import { usePatients } from "@/lib/context/PatientsContext";
import PatientSearchResults from "@/components/interactive/PatientSearchResults";
import useDebounce from "@/hooks/useDebounce";
import { matchesPatientSearch } from "@/lib/utils/patient";

interface PatientTopMenuLayoutProps {
  children: ReactNode;
  getPatientLink?: (patientId: number) => string;
}

export default function PatientTopMenuLayout({
  children,
  getPatientLink,
}: PatientTopMenuLayoutProps) {
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300);
  const { patientsById, isLoading, isRefetching } = usePatients();

  const filteredPatients = useMemo(() => {
    if (!debouncedSearchText.trim()) {
      return [];
    }

    return Object.values(patientsById).filter((patient) =>
      matchesPatientSearch(patient, debouncedSearchText),
    );
  }, [patientsById, debouncedSearchText]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* top menu */}
      <div className="sticky top-0 z-1">
        <div className="relative flex flex-row p-2 bg-neutral-75 shadow-lg">
          {/* search input */}
          <SearchInput searchText={searchText} setSearchText={setSearchText} />
          <PatientSearchResults
            searchText={debouncedSearchText}
            filteredPatients={filteredPatients}
            isLoading={isLoading}
            isRefetching={isRefetching}
            onSelect={() => setSearchText("")}
            getPatientLink={getPatientLink}
          />
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
