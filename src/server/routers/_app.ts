/**
 * This file contains the root router of the tRPC-backend
 */
import { createCallerFactory, publicProcedure, router } from "../trpc";
import { villageCodeRouter } from "./villageCodeRouters";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => "yay!"),

  villageCodeRouter: villageCodeRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
