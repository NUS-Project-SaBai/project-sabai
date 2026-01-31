import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Creates the request context for the tRPC server.
 * Uses HttpOnly cookies for authentication (more secure than Bearer tokens).
 */
export const createContext = async ({ req, res }: CreateNextContextOptions) => {
  // Create a Supabase client that reads/writes cookies from the request/response
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(req.headers.cookie ?? "").filter(
          (cookie): cookie is { name: string; value: string } =>
            cookie.value !== undefined,
        );
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.appendHeader(
            "Set-Cookie",
            serializeCookieHeader(name, value, options),
          );
        });
      },
    },
  });

  // getUser() reads the session from cookies and validates it with Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    req,
    res,
    user, // Authenticated Supabase user (or null)
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
