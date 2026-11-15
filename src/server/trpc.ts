/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @see https://trpc.io/docs/v11/router
 * @see https://trpc.io/docs/v11/procedures
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { transformer } from "@/utils/transformer";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/v11/data-transformers
   */
  transformer,
  /**
   * @see https://trpc.io/docs/v11/error-formatting
   */
  errorFormatter({ shape }) {
    return shape;
  },
});

/**
 * Create a router
 * @see https://trpc.io/docs/v11/router
 */
export const router = t.router;

/**
 * Create an unprotected procedure
 * @see https://trpc.io/docs/v11/procedures
 **/
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    // ctx.user comes from context creation logic using Supabase Auth
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Every login must be linked by hand to a public.users row. That row's id
  // (not the auth user id) is what FKs such as consults.doctor_id reference.
  const [appUser] = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, ctx.user.id))
    .limit(1);

  if (!appUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "This account has not been linked to a user yet. Ask an admin to link your account.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      // infers that `user` is non-nullable to downstream resolvers
      user: ctx.user,
      // The public.users row for the logged-in account. Use appUser.id for FKs.
      appUser,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * Merge multiple routers together
 * @see https://trpc.io/docs/v11/merging-routers
 */
export const mergeRouters = t.mergeRouters;

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/v11/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;
