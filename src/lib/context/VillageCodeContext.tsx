import { createContext, useContext, ReactNode, useCallback } from "react";
import { trpc } from "@/utils/trpc";
import { useSaveOnWrite } from "@/hooks/useSaveOnWrite";
import type { VillageCode } from "@/db/schema";

interface VillageCodeContextValue {
  selectedVillageCodeId: number | null;
  setSelectedVillageCodeId: (id: number | null) => void;
  villageCodes: VillageCode[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}

const VillageCodeContext = createContext<VillageCodeContextValue | undefined>(
  undefined,
);

export function VillageCodeProvider({ children }: { children: ReactNode }) {
  const {
    data: villageCodes,
    isLoading,
    isError,
    error,
  } = trpc.villageCodesRouter.list.useQuery({
    includeHidden: false,
  });

  const [villageState, setVillageState] = useSaveOnWrite<{
    selectedVillageCodeId: number | null;
  }>("villageCodeState", { selectedVillageCodeId: null });

  const selectedVillageCodeId = villageState.selectedVillageCodeId;

  const setSelectedVillageCodeId = useCallback(
    (id: number | null) => {
      setVillageState({ selectedVillageCodeId: id });
    },
    [setVillageState],
  );

  return (
    <VillageCodeContext.Provider
      value={{
        selectedVillageCodeId,
        setSelectedVillageCodeId,
        villageCodes,
        isLoading,
        isError,
        error,
      }}
    >
      {children}
    </VillageCodeContext.Provider>
  );
}

export function useVillageCode() {
  const context = useContext(VillageCodeContext);
  if (context === undefined) {
    throw new Error("useVillageCode must be used within a VillageCodeProvider");
  }
  return context;
}
