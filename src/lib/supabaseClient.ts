import { createBrowserClient } from "@supabase/ssr";
import env from "./env";

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Browser client for Supabase.
 * Uses @supabase/ssr which automatically manages auth state in cookies.
 * This makes the session available to the server without exposing tokens to JS.
 */
export const supabase = createBrowserClient(
  supabaseUrl,
  supabasePublishableKey,
);
