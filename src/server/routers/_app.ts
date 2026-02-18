/**
 * This file contains the root router of the tRPC-backend
 */
import { createCallerFactory, publicProcedure, router } from "../trpc";
import { villageCodesRouter } from "./village_codes_router";
import { patientsRouter } from "./patients_router";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => "yay!"),

  villageCodesRouter: villageCodesRouter,
  patientsRouter: patientsRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
