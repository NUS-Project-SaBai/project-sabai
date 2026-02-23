import { trpc } from "@/utils/trpc";
import { ReactNode, useState } from "react";
import SearchInput from "@/components/interactive/inputs/SearchInput";

interface PatientTopMenuLayoutProps {
  children: ReactNode;
}

export default function PatientTopMenuLayout({
  children,
}: PatientTopMenuLayoutProps) {
  const [searchText, setSearchText] = useState("");
  const { data: patients, isLoading } = trpc.patientsRouter.list.useQuery();

  return (
    <div className="min-h-screen flex flex-col">
      {/* top menu */}
      <div className="sticky flex flex-row top-0 p-2 bg-neutral-75 shadow-lg">
        {/* search input */}
        <SearchInput setText={setSearchText} />
      </div>

      <div className="flex-1">{children}</div>
    </div>
  );
}
