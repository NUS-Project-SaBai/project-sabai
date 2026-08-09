/**
 * This file contains the root router of the tRPC-backend
 */
import { createCallerFactory, publicProcedure, router } from "@/server/trpc";
import { villageCodesRouter } from "./village_codes_router";
import { patientsRouter } from "./patients_router";
import { medicationActiveIngredientsRouter } from "./medication_active_ingredient_router";
import { medicationBrandRouter } from "./medication_brand_router";
import { medicationStockRouter } from "./medication_stock_router";
import { visitsRouter } from "./visits_router";
import { vitalsRouter } from "./vitals_router";
import { eyesightRouter } from "./eyesight_router";
import { pubertyRouter } from "./puberty_router";
import { consultsRouter } from "./consults_router";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => "yay!"),

  villageCodesRouter: villageCodesRouter,
  patientsRouter: patientsRouter,
  medicationActiveIngredientsRouter: medicationActiveIngredientsRouter,
  medicationBrandRouter: medicationBrandRouter,
  medicationStockRouter: medicationStockRouter,
  visitsRouter: visitsRouter,
  vitalsRouter: vitalsRouter,
  eyesightRouter: eyesightRouter,
  pubertyRouter: pubertyRouter,
  consultsRouter: consultsRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
