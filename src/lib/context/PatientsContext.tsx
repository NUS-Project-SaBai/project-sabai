import { createContext, useContext, useMemo, ReactNode } from "react";
import { trpc } from "@/utils/trpc";
import { PatientsRouterListItem } from "@/utils/trpc-types";

type PatientsById = Record<number, PatientsRouterListItem>;

interface PatientsContextType {
  patientsById: PatientsById;
  isLoading: boolean;
  isRefetching: boolean;
}

const PatientsContext = createContext<PatientsContextType | undefined>(
  undefined,
);

export function PatientsProvider({ children }: { children: ReactNode }) {
  const {
    data: patients = [],
    isLoading,
    isRefetching,
  } = trpc.patientsRouter.list.useQuery();

  // put patients into object for quick access and mutation by id
  const patientsById = useMemo<PatientsById>(() => {
    return patients.reduce<PatientsById>((accumulator, patient) => {
      accumulator[patient.id] = patient;
      return accumulator;
    }, {});
  }, [patients]);

  return (
    <PatientsContext.Provider value={{ patientsById, isLoading, isRefetching }}>
      {children}
    </PatientsContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientsContext);
  if (context === undefined) {
    throw new Error("usePatients must be used within PatientsProvider");
  }
  return context;
}
