import { ReactNode, useMemo, useState } from "react";
import SearchInput from "@/components/interactive/inputs/SearchInput";
import { trpc } from "@/utils/trpc";
import PatientSearchResults from "@/components/interactive/PatientSearchResults";
import useDebounce from "@/hooks/useDebounce";
import { createPatientSearch } from "@/lib/utils/patient-search";

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
  const {
    data: patients,
    isLoading,
    isRefetching,
    isError,
  } = trpc.patientsRouter.listWithLatestVisit.useQuery();

  const searchPatients = useMemo(
    () => createPatientSearch(patients ?? []),
    [patients],
  );
  const filteredPatients = useMemo(
    () => searchPatients(debouncedSearchText),
    [searchPatients, debouncedSearchText],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-1">
        <div className="relative flex flex-row p-2 bg-neutral-75 shadow-lg">
          <SearchInput searchText={searchText} setSearchText={setSearchText} />
          <PatientSearchResults
            searchText={debouncedSearchText}
            filteredPatients={filteredPatients}
            isLoading={isLoading}
            isRefetching={isRefetching}
            isError={isError}
            onSelect={() => setSearchText("")}
            getPatientLink={getPatientLink}
          />
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
