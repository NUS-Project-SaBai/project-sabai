import type { RouterOutput } from "@/utils/trpc";

export type PatientsRouterListOutput = RouterOutput["patientsRouter"]["list"];
export type PatientsRouterListItem = PatientsRouterListOutput[number];

export type PatientsRouterListWithLatestVisitOutput =
  RouterOutput["patientsRouter"]["listWithLatestVisit"];
export type PatientsRouterListWithLatestVisitItem =
  PatientsRouterListWithLatestVisitOutput[number];
