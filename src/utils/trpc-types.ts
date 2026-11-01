import type { RouterOutput } from "@/utils/trpc";

export type PatientsRouterListWithLatestVisitOutput =
  RouterOutput["patientsRouter"]["listWithLatestVisit"];
export type PatientsRouterListWithLatestVisitItem =
  PatientsRouterListWithLatestVisitOutput[number];
