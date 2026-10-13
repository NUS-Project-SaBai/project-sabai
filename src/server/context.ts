import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { getRequestUser } from "@/server/auth";

/**
 * Creates the request context for the tRPC server.
 * Uses HttpOnly cookies for authentication (more secure than Bearer tokens).
 */
export const createContext = async ({ req, res }: CreateNextContextOptions) => {
  const user = await getRequestUser(req, res);

  return {
    req,
    res,
    user, // Authenticated Supabase user (or null)
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
