import { ReactNode, useMemo, useState } from "react";
import SearchInput from "@/components/interactive/inputs/SearchInput";
import { usePatients } from "@/lib/context/PatientsContext";
import PatientSearchResults from "@/components/interactive/PatientSearchResults";
import useDebounce from "@/hooks/useDebounce";

interface PatientTopMenuLayoutProps {
  children: ReactNode;
}

export default function PatientTopMenuLayout({
  children,
}: PatientTopMenuLayoutProps) {
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300);
  const { patientsById, isLoading, isRefetching } = usePatients();

  const filteredPatients = useMemo(() => {
    const normalizedSearchText = debouncedSearchText.trim().toLowerCase();

    if (!normalizedSearchText) {
      return [];
    }

    return Object.values(patientsById).filter((patient) => {
      const normalizedId = patient.id.toString();
      const normalizedName = patient.name.toLowerCase();
      const normalizedIdentificationNumber =
        patient.identificationNumber?.toLowerCase() ?? "";

      return (
        normalizedId.includes(normalizedSearchText) ||
        normalizedName.includes(normalizedSearchText) ||
        normalizedIdentificationNumber.includes(normalizedSearchText)
      );
    });
  }, [patientsById, debouncedSearchText]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* top menu */}
      <div className="sticky top-0 z-10">
        <div className="relative flex flex-row p-2 bg-neutral-75 shadow-lg">
          {/* search input */}
          <SearchInput searchText={searchText} setSearchText={setSearchText} />
          <PatientSearchResults
            searchText={debouncedSearchText}
            filteredPatients={filteredPatients}
            isLoading={isLoading}
            isRefetching={isRefetching}
            onSelect={() => setSearchText("")}
          />
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
