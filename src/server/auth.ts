import type { IncomingMessage, ServerResponse } from "http";
import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import env from "@/lib/envVariables";

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Returns the authenticated Supabase user for a Pages Router request, or null.
 * Uses HttpOnly cookies for authentication (more secure than Bearer tokens).
 */
export async function getRequestUser(
  req: IncomingMessage,
  res: ServerResponse,
) {
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

  return user;
}
