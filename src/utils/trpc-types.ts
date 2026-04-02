import type { RouterOutput } from "@/utils/trpc";

export type PatientsRouterListOutput = RouterOutput["patientsRouter"]["list"];
export type PatientsRouterListItem = PatientsRouterListOutput[number];
